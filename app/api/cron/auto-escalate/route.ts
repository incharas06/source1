// app/api/cron/auto-escalate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase/client'; // Make sure this points to your client Firebase config
import {
    collection,
    query,
    where,
    getDocs,
    updateDoc,
    doc,
    arrayUnion,
    Timestamp
} from 'firebase/firestore';

// Helper functions - ADD THESE
function getAuthorityName(level: number) {
    switch (level) {
        case 0: return 'PDO';
        case 1: return 'TDO';
        case 2: return 'DDO';
        default: return 'PDO';
    }
}

function getRoleFromLevel(level: number) {
    switch (level) {
        case 0: return 'pdo';
        case 1: return 'tdo';
        case 2: return 'ddo';
        default: return 'pdo';
    }
}

export async function GET(request: NextRequest) {
    // This endpoint will be called by Vercel Cron
    const authHeader = request.headers.get('authorization');

    // Secure your cron endpoint
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const now = Timestamp.now();
        const escalatedIssues = [];

        // Find issues that need auto-escalation
        const issuesQuery = query(
            collection(db, 'issues'),
            where('status', 'in', ['pending', 'in_progress']),
            where('resolveDueAt', '<=', now)
        );

        const issuesSnapshot = await getDocs(issuesQuery);

        for (const issueDoc of issuesSnapshot.docs) {
            const issue = issueDoc.data();
            const issueRef = doc(db, 'issues', issueDoc.id);

            // Check if issue has createdAt field
            if (!issue.createdAt) {
                console.warn(`Issue ${issueDoc.id} missing createdAt, skipping`);
                continue;
            }

            // Calculate SLA days passed
            const createdAt = issue.createdAt;
            const slaDays = issue.slaDays || 7;

            // Safely calculate days passed
            const createdAtMillis = createdAt.toMillis ? createdAt.toMillis() : createdAt;
            const nowMillis = now.toMillis ? now.toMillis() : now;
            const daysPassed = Math.floor((Number(nowMillis) - Number(createdAtMillis)) / (1000 * 60 * 60 * 24));

            const currentLevel = issue.escalatedLevel || 0;
            let shouldEscalate = false;
            let nextLevel = currentLevel;

            // Auto escalation logic
            if (currentLevel === 0 && daysPassed >= slaDays) {
                nextLevel = 1; // PDO → TDO
                shouldEscalate = true;
            } else if (currentLevel === 1 && daysPassed >= (slaDays * 2)) {
                nextLevel = 2; // TDO → DDO
                shouldEscalate = true;
            }

            if (shouldEscalate) {
                // Check if manual escalation was already used at this level
                const manualUsed = issue.manualEscalationUsed === true;
                if (manualUsed && currentLevel === 0) {
                    console.log(`Issue ${issueDoc.id} has manual escalation used, skipping auto escalation from PDO to TDO`);
                    continue;
                }

                await updateDoc(issueRef, {
                    escalatedLevel: nextLevel,
                    assignedRole: getRoleFromLevel(nextLevel),
                    'escalation.history': arrayUnion({
                        type: 'auto',
                        from: getAuthorityName(currentLevel),
                        to: getAuthorityName(nextLevel),
                        at: now,
                        reason: `Auto escalated after ${daysPassed} days (SLA: ${slaDays} days)`,
                        level: nextLevel
                    }),
                    'escalation.lastEscalatedTo': getAuthorityName(nextLevel),
                    updatedAt: now
                });

                escalatedIssues.push({
                    id: issueDoc.id,
                    from: getAuthorityName(currentLevel),
                    to: getAuthorityName(nextLevel),
                    daysPassed,
                    slaDays
                });

                console.log(`Auto escalated issue ${issueDoc.id} from ${getAuthorityName(currentLevel)} to ${getAuthorityName(nextLevel)}`);
            }
        }

        return NextResponse.json({
            success: true,
            escalatedCount: escalatedIssues.length,
            issues: escalatedIssues,
            timestamp: now.toDate().toISOString()
        });

    } catch (error: any) {
        console.error('Auto-escalation cron error:', error);
        return NextResponse.json(
            {
                error: error.message || 'Failed to run auto-escalation',
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}