import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Video, Mic, Brain, Clock, Users, X } from 'lucide-react';

interface ConsentFlowProps {
    onConsent: (consents: ConsentData) => void;
    onDecline: () => void;
    isOpen: boolean;
}

export interface ConsentData {
    videoRecording: boolean;
    audioRecording: boolean;
    aiAnalysis: boolean;
    dataRetention: boolean;
    dataUsage: boolean;
    withdrawConsent: boolean;
}

const ConsentFlow: React.FC<ConsentFlowProps> = ({ onConsent, onDecline, isOpen }) => {
    const { t } = useTranslation();
    const [consents, setConsents] = useState<ConsentData>({
        videoRecording: false,
        audioRecording: false,
        aiAnalysis: false,
        dataRetention: false,
        dataUsage: false,
        withdrawConsent: false,
    });

    const handleConsentChange = (key: keyof ConsentData) => {
        setConsents(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const allConsentsGiven = Object.values(consents).every(consent => consent);

    const handleAgree = () => {
        if (allConsentsGiven) {
            onConsent(consents);
        }
    };

    const consentItems = [
        {
            key: 'videoRecording' as keyof ConsentData,
            icon: Video,
            title: t('consent.videoRecording.title'),
            description: t('consent.videoRecording.description'),
        },
        {
            key: 'audioRecording' as keyof ConsentData,
            icon: Mic,
            title: t('consent.audioRecording.title'),
            description: t('consent.audioRecording.description'),
        },
        {
            key: 'aiAnalysis' as keyof ConsentData,
            icon: Brain,
            title: t('consent.aiAnalysis.title'),
            description: t('consent.aiAnalysis.description'),
        },
        {
            key: 'dataRetention' as keyof ConsentData,
            icon: Clock,
            title: t('consent.dataRetention.title'),
            description: t('consent.dataRetention.description'),
        },
        {
            key: 'dataUsage' as keyof ConsentData,
            icon: Users,
            title: t('consent.dataUsage.title'),
            description: t('consent.dataUsage.description'),
        },
        {
            key: 'withdrawConsent' as keyof ConsentData,
            icon: Shield,
            title: t('consent.withdrawConsent.title'),
            description: t('consent.withdrawConsent.description'),
        },
    ];

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                            <Shield className="w-8 h-8 text-primary-600" />
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {t('consent.title')}
                                </h2>
                                <p className="text-gray-600 mt-1">
                                    {t('consent.subtitle')}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onDecline}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Consent Items */}
                    <div className="space-y-4 mb-6">
                        {consentItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <div key={item.key} className="consent-checkbox">
                                    <input
                                        type="checkbox"
                                        id={item.key}
                                        checked={consents[item.key]}
                                        onChange={() => handleConsentChange(item.key)}
                                        className="mt-1"
                                    />
                                    <label htmlFor={item.key} className="flex-1">
                                        <div className="flex items-start space-x-3">
                                            <Icon className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <strong>{item.title}</strong>
                                                <p className="text-gray-600 mt-1">{item.description}</p>
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            );
                        })}
                    </div>

                    {/* Required Notice */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                        <p className="text-amber-800 text-sm">
                            <strong>Note:</strong> {t('consent.required')}
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-4">
                        <button
                            onClick={onDecline}
                            className="btn-secondary flex-1"
                        >
                            {t('consent.decline')}
                        </button>
                        <button
                            onClick={handleAgree}
                            disabled={!allConsentsGiven}
                            className={`btn-primary flex-1 ${!allConsentsGiven
                                    ? 'opacity-50 cursor-not-allowed'
                                    : ''
                                }`}
                        >
                            {t('consent.agree')}
                        </button>
                    </div>

                    {/* Decline Message */}
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-800 text-sm">
                            {t('consent.declineMessage')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConsentFlow;




