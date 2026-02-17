export type Locale = "en" | "kn" | "hi";

export const LOCALES: { id: Locale; label: string }[] = [
    { id: "en", label: "English" },
    { id: "kn", label: "ಕನ್ನಡ" },
    { id: "hi", label: "हिन्दी" },
];

export function normalizeLocale(x: any): Locale {
    if (x === "kn" || x === "hi" || x === "en") return x;
    return "en";
}

// ✅ Villager-only strings (dashboard + raise issue)
export const VILLAGER_T = {
    en: {
        appName: "VITAL",
        brandTag: "Rural Governance Platform",
        loader: "Loading…",

        role: {
            choose: "Choose Role",
            villager: "Villager",
            authority: "Authority",
            admin: "Admin",
        },

        dash: {
            title: "Villager Dashboard",
            subtitle: "Track and report village issues",
            raise: "Raise Issue",
            track: "My Issues",
            community: "Community Issues",
            profile: "My Profile",
            total: "Total Issues",
            pending: "Pending",
            resolved: "Resolved",
        },

        raise: {
            title: "Raise an Issue",
            subtitle: "Report a village problem with photo + location",
            issueTitle: "Issue Title",
            other: "Other",
            category: "Category",
            description: "Description",
            photo: "Photo (required)",
            location: "Location",
            getLocation: "Get Current Location",
            locationOk: "Location captured",
            locationNeed: "Please capture location",
            submit: "Submit Issue",
            submitting: "Submitting…",
            errFill: "Please fill all required fields.",
            errGeo: "Photo must contain GPS (geo-tag). Use camera and enable location.",
            success: "Issue submitted successfully.",
        },

        categories: ["Road", "Water", "Drainage", "Sanitation", "Electricity", "Health", "Other"],
        titles: [
            "Potholes / Road Damage",
            "Water Shortage",
            "Drainage Blockage",
            "Garbage Not Collected",
            "Streetlight Not Working",
            "Medical Help Needed",
            "Other",
        ],
    },

    kn: {
        appName: "VITAL",
        brandTag: "ಗ್ರಾಮೀಣ ಆಡಳಿತ ವೇದಿಕೆ",
        loader: "ಲೋಡ್ ಆಗುತ್ತಿದೆ…",

        role: {
            choose: "ಪಾತ್ರ ಆಯ್ಕೆ ಮಾಡಿ",
            villager: "ಗ್ರಾಮಸ್ಥ",
            authority: "ಅಧಿಕಾರಿ",
            admin: "ಅಡ್ಮಿನ್",
        },

        dash: {
            title: "ಗ್ರಾಮಸ್ಥರ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
            subtitle: "ಗ್ರಾಮ ಸಮಸ್ಯೆಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ",
            raise: "ಸಮಸ್ಯೆ ಸಲ್ಲಿಸಿ",
            track: "ನನ್ನ ಸಮಸ್ಯೆಗಳು",
            community: "ಗ್ರಾಮ ಸಮಸ್ಯೆಗಳು",
            profile: "ನನ್ನ ಪ್ರೊಫೈಲ್",
            total: "ಒಟ್ಟು",
            pending: "ಬಾಕಿ",
            resolved: "ಪರಿಹಾರಗೊಂಡ",
        },

        raise: {
            title: "ಸಮಸ್ಯೆ ಸಲ್ಲಿಸಿ",
            subtitle: "ಫೋಟೋ + ಲೊಕೇಶನ್ ಸಹಿತ ಸಮಸ್ಯೆ ವರದಿ ಮಾಡಿ",
            issueTitle: "ಸಮಸ್ಯೆಯ ಶೀರ್ಷಿಕೆ",
            other: "ಇತರೆ",
            category: "ವರ್ಗ",
            description: "ವಿವರಣೆ",
            photo: "ಫೋಟೋ (ಅಗತ್ಯ)",
            location: "ಲೊಕೇಶನ್",
            getLocation: "ಪ್ರಸ್ತುತ ಲೊಕೇಶನ್ ಪಡೆಯಿರಿ",
            locationOk: "ಲೊಕೇಶನ್ ಸೇವ್ ಆಗಿದೆ",
            locationNeed: "ದಯವಿಟ್ಟು ಲೊಕೇಶನ್ ಪಡೆಯಿರಿ",
            submit: "ಸಲ್ಲಿಸಿ",
            submitting: "ಸಲ್ಲಿಸಲಾಗುತ್ತಿದೆ…",
            errFill: "ಅಗತ್ಯ ಫೀಲ್ಡ್‌ಗಳನ್ನು ತುಂಬಿ.",
            errGeo: "ಫೋಟೋಗೆ GPS (ಜಿಯೋ-ಟ್ಯಾಗ್) ಇರಬೇಕು. ಕ್ಯಾಮೆರಾ ಬಳಸಿ, ಲೊಕೇಶನ್ ಆನ್ ಮಾಡಿ.",
            success: "ಸಮಸ್ಯೆ ಯಶಸ್ವಿಯಾಗಿ ಸಲ್ಲಿಸಲಾಗಿದೆ.",
        },

        categories: ["ರಸ್ತೆ", "ನೀರು", "ಡ್ರೈನೇಜ್", "ಸ್ವಚ್ಛತೆ", "ವಿದ್ಯುತ್", "ಆರೋಗ್ಯ", "ಇತರೆ"],
        titles: [
            "ಗುಂಡಿ ರಸ್ತೆಗಳು / ರಸ್ತೆ ಹಾನಿ",
            "ನೀರಿನ ಕೊರತೆ",
            "ಡ್ರೈನೇಜ್ ತಡೆ",
            "ಕಸ ಸಂಗ್ರಹವಾಗಿಲ್ಲ",
            "ಸ್ಟ್ರೀಟ್‌ಲೈಟ್ ಕೆಲಸ ಮಾಡುತ್ತಿಲ್ಲ",
            "ವೈದ್ಯಕೀಯ ಸಹಾಯ ಬೇಕು",
            "ಇತರೆ",
        ],
    },

    hi: {
        appName: "VITAL",
        brandTag: "ग्रामीण शासन प्लेटफ़ॉर्म",
        loader: "लोड हो रहा है…",

        role: {
            choose: "भूमिका चुनें",
            villager: "ग्रामीण",
            authority: "अधिकारी",
            admin: "एडमिन",
        },

        dash: {
            title: "ग्रामीण डैशबोर्ड",
            subtitle: "ग्राम समस्याएँ देखें और दर्ज करें",
            raise: "समस्या दर्ज करें",
            track: "मेरी समस्याएँ",
            community: "सामुदायिक समस्याएँ",
            profile: "मेरी प्रोफ़ाइल",
            total: "कुल",
            pending: "लंबित",
            resolved: "हल हो चुकी",
        },

        raise: {
            title: "समस्या दर्ज करें",
            subtitle: "फोटो + लोकेशन के साथ समस्या रिपोर्ट करें",
            issueTitle: "समस्या शीर्षक",
            other: "अन्य",
            category: "श्रेणी",
            description: "विवरण",
            photo: "फोटो (ज़रूरी)",
            location: "लोकेशन",
            getLocation: "वर्तमान लोकेशन लें",
            locationOk: "लोकेशन सेव हो गई",
            locationNeed: "कृपया लोकेशन लें",
            submit: "सबमिट करें",
            submitting: "सबमिट हो रहा है…",
            errFill: "कृपया आवश्यक फ़ील्ड भरें।",
            errGeo: "फोटो में GPS (Geo-tag) होना चाहिए। कैमरा इस्तेमाल करें और लोकेशन ऑन करें।",
            success: "समस्या सफलतापूर्वक सबमिट हो गई।",
        },

        categories: ["सड़क", "पानी", "ड्रेनेज", "स्वच्छता", "बिजली", "स्वास्थ्य", "अन्य"],
        titles: [
            "गड्ढे / सड़क खराब",
            "पानी की कमी",
            "ड्रेनेज जाम",
            "कचरा नहीं उठाया",
            "स्ट्रीट लाइट खराब",
            "मेडिकल मदद चाहिए",
            "अन्य",
        ],
    },
} as const;
