
import React from 'react';
import { Mail, Users, Clock, Shield } from 'lucide-react';

export const EmailStats = () => {
  const stats = [
    {
      icon: Mail,
      label: 'Emails Generated',
      value: '2.5M+',
      color: 'text-blue-600'
    },
    {
      icon: Users,
      label: 'Active Users',
      value: '45K+',
      color: 'text-green-600'
    },
    {
      icon: Clock,
      label: 'Avg. Lifetime',
      value: '1 Hour',
      color: 'text-orange-600'
    },
    {
      icon: Shield,
      label: 'Security Level',
      value: '100%',
      color: 'text-purple-600'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white rounded-xl p-6 shadow-lg border hover:shadow-xl transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
            <div className={`p-3 rounded-lg bg-opacity-10 ${stat.color.replace('text-', 'bg-')}`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
