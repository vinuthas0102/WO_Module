import React from 'react';
import { Mail, MessageSquare, Phone, HelpCircle } from 'lucide-react';
import { NotificationChannel } from '../../types';

interface NotificationChannelSelectorProps {
  selectedChannels: NotificationChannel[];
  onChange: (channels: NotificationChannel[]) => void;
  showDemoBadge?: boolean;
}

export const NotificationChannelSelector: React.FC<NotificationChannelSelectorProps> = ({
  selectedChannels,
  onChange,
  showDemoBadge = true
}) => {
  const toggleChannel = (channel: NotificationChannel) => {
    if (selectedChannels.includes(channel)) {
      onChange(selectedChannels.filter(c => c !== channel));
    } else {
      onChange([...selectedChannels, channel]);
    }
  };

  const channels = [
    {
      id: 'SMS' as NotificationChannel,
      label: 'SMS',
      icon: MessageSquare,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      hoverColor: 'hover:bg-green-100'
    },
    {
      id: 'EMAIL' as NotificationChannel,
      label: 'Email',
      icon: Mail,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      hoverColor: 'hover:bg-blue-100'
    },
    {
      id: 'WHATSAPP' as NotificationChannel,
      label: 'WhatsApp',
      icon: Phone,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      hoverColor: 'hover:bg-emerald-100'
    }
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-700 flex items-center space-x-1">
          <span>Notify via</span>
          {showDemoBadge && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded border border-yellow-300">
              Demo Mode
            </span>
          )}
        </label>
        <button
          type="button"
          className="text-gray-400 hover:text-gray-600"
          title="Notification Info"
          onClick={() => {
            alert('DEMO MODE: Notifications are logged but not sent.\n\nTo enable real notifications:\n- SMS: Integrate Twilio or AWS SNS\n- Email: Integrate SendGrid or AWS SES\n- WhatsApp: Integrate WhatsApp Business API');
          }}
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {channels.map((channel) => {
          const Icon = channel.icon;
          const isSelected = selectedChannels.includes(channel.id);

          return (
            <button
              key={channel.id}
              type="button"
              onClick={() => toggleChannel(channel.id)}
              className={`
                flex items-center space-x-2 px-3 py-2 rounded-lg border-2 transition-all
                ${isSelected
                  ? `${channel.bgColor} ${channel.borderColor} ${channel.color}`
                  : 'bg-white border-gray-200 text-gray-600'
                }
                ${channel.hoverColor}
              `}
            >
              <Icon className="w-4 h-4" />
              <span className="text-xs font-medium">{channel.label}</span>
              {isSelected && (
                <div className="w-2 h-2 rounded-full bg-current" />
              )}
            </button>
          );
        })}
      </div>

      {showDemoBadge && selectedChannels.length > 0 && (
        <p className="text-xs text-gray-500 italic">
          Notifications will be logged in demo mode (not actually sent)
        </p>
      )}
    </div>
  );
};
