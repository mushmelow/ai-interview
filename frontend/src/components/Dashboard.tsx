import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
    Video,
    Clock,
    TrendingUp,
    Users,
    Calendar,
    Play,
    BarChart3
} from 'lucide-react';

const Dashboard: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const handleStartInterview = () => {
        navigate('/consent');
    };

    const mockInterviews = [
        {
            id: 1,
            candidateName: 'John Doe',
            position: 'Software Engineer',
            date: '2024-01-15',
            status: 'completed',
            score: 8.5,
        },
        {
            id: 2,
            candidateName: 'Jane Smith',
            position: 'Product Manager',
            date: '2024-01-14',
            status: 'completed',
            score: 7.8,
        },
        {
            id: 3,
            candidateName: 'Mike Johnson',
            position: 'Data Scientist',
            date: '2024-01-16',
            status: 'scheduled',
            score: null,
        },
    ];

    const stats = [
        {
            title: 'Total Interviews',
            value: '24',
            change: '+12%',
            icon: Video,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
        },
        {
            title: 'Completed Today',
            value: '3',
            change: '+1',
            icon: Clock,
            color: 'text-green-600',
            bgColor: 'bg-green-100',
        },
        {
            title: 'Average Score',
            value: '7.8',
            change: '+0.3',
            icon: TrendingUp,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100',
        },
        {
            title: 'Active Candidates',
            value: '8',
            change: '+2',
            icon: Users,
            color: 'text-orange-600',
            bgColor: 'bg-orange-100',
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {t('dashboard.welcome')}
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Manage your AI-powered interviews and track candidate performance
                    </p>
                </div>
                <button
                    onClick={handleStartInterview}
                    className="btn-primary flex items-center space-x-2"
                >
                    <Play className="w-5 h-5" />
                    <span>Start New Interview</span>
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className="card">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">
                                        {stat.title}
                                    </p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">
                                        {stat.value}
                                    </p>
                                    <p className="text-sm text-green-600 mt-1">
                                        {stat.change}
                                    </p>
                                </div>
                                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                                    <Icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Recent Interviews */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">
                            {t('dashboard.recentInterviews')}
                        </h2>
                        <BarChart3 className="w-5 h-5 text-gray-400" />
                    </div>

                    <div className="space-y-3">
                        {mockInterviews.map((interview) => (
                            <div
                                key={interview.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                                        <Users className="w-5 h-5 text-primary-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">
                                            {interview.candidateName}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            {interview.position}
                                        </p>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                                        <Calendar className="w-4 h-4" />
                                        <span>{interview.date}</span>
                                    </div>
                                    {interview.score && (
                                        <p className="text-sm font-medium text-gray-900 mt-1">
                                            Score: {interview.score}/10
                                        </p>
                                    )}
                                    <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${interview.status === 'completed'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {interview.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="card">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        Quick Actions
                    </h2>

                    <div className="space-y-3">
                        <button
                            onClick={handleStartInterview}
                            className="w-full flex items-center justify-between p-4 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                        >
                            <div className="flex items-center space-x-3">
                                <Video className="w-5 h-5 text-primary-600" />
                                <span className="font-medium text-primary-900">
                                    Start New Interview
                                </span>
                            </div>
                            <Play className="w-4 h-4 text-primary-600" />
                        </button>

                        <button className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                            <div className="flex items-center space-x-3">
                                <BarChart3 className="w-5 h-5 text-gray-600" />
                                <span className="font-medium text-gray-900">
                                    View Analytics
                                </span>
                            </div>
                            <TrendingUp className="w-4 h-4 text-gray-600" />
                        </button>

                        <button className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                            <div className="flex items-center space-x-3">
                                <Users className="w-5 h-5 text-gray-600" />
                                <span className="font-medium text-gray-900">
                                    Manage Candidates
                                </span>
                            </div>
                            <Users className="w-4 h-4 text-gray-600" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;




