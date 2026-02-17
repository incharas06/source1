// app/api/escalation/manual/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase/client';
import { doc, getDoc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
    try {
        const { issueId } = await request.json();

        if (!issueId) {
            return NextResponse.json(
                { error: 'Issue ID is required' },
                { status: 400 }
            );
        }

        // Get issue from Firestore
        const issueRef = doc(db, 'issues', issueId);

        // Calculate new escalation level
        const issueDoc = await getDoc(issueRef);
        const issue = issueDoc.data();

        if (!issue) {
            return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
        }

        const currentLevel = issue.escalatedLevel || 0;
        let nextLevel = currentLevel + 1;

        // Cap at DDO (level 2)
        if (nextLevel > 2) nextLevel = 2;

        // Update issue with manual escalation
        await updateDoc(issueRef, {
            escalatedLevel: nextLevel,
            assignedRole: getRoleFromLevel(nextLevel),
            manualEscalationUsed: true,
            'escalation.history': arrayUnion({
                type: 'manual',
                from: getAuthorityName(currentLevel),
                to: getAuthorityName(nextLevel),
                at: Timestamp.now(),
                reason: 'Manually escalated by villager',
                level: nextLevel
            }),
            'escalation.lastEscalatedTo': getAuthorityName(nextLevel),
            updatedAt: Timestamp.now()
        });

        // Send notification (you can implement email or in-app notification here)
        await sendNotificationToAuthority(nextLevel, issue);

        return NextResponse.json({
            success: true,
            message: 'Manual escalation completed successfully',
            newLevel: nextLevel
        });

    } catch (error: any) {
        console.error('Escalation error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to escalate issue' },
            { status: 500 }
        );
    }
}

// Helper functions
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

async function sendNotificationToAuthority(level: number, issue: any) {
    // Implement your notification logic here
    // This could be:
    // 1. Send email using Nodemailer or Resend
    // 2. Create a notification document in Firestore
    // 3. Use a notification service like OneSignal
    console.log(`Notification sent to ${getAuthorityName(level)} for issue ${issue.id}`);
}