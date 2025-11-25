import { NotificationChannel } from '../types';

export interface NotificationTemplate {
  channel: NotificationChannel;
  template: string;
  description: string;
}

export class NotificationService {
  static logNotificationIntent(
    channels: NotificationChannel[],
    recipient: { id: string; name: string; email?: string },
    message: {
      subject: string;
      content: string;
      threadId?: string;
    }
  ): void {
    console.group('🔔 DEMO NOTIFICATION LOG');
    console.log('📅 Timestamp:', new Date().toISOString());
    console.log('👤 Recipient:', recipient.name, `(${recipient.email || 'No email'})`);
    console.log('📋 Subject:', message.subject);
    console.log('💬 Message:', message.content.substring(0, 100) + (message.content.length > 100 ? '...' : ''));

    channels.forEach(channel => {
      const template = this.getNotificationTemplate(channel, recipient.name, message.subject, message.content);
      console.log(`\n📱 ${channel}:`);
      console.log(template);
    });

    console.log('\n⚠️  NOTE: This is a DEMO mode. No actual notifications are sent.');
    console.log('💡 To enable real notifications, integrate with:');
    console.log('   - SMS: Twilio, AWS SNS, or similar service');
    console.log('   - EMAIL: SendGrid, AWS SES, or similar service');
    console.log('   - WHATSAPP: Twilio WhatsApp API, WhatsApp Business API');
    console.groupEnd();
  }

  static getNotificationTemplate(
    channel: NotificationChannel,
    recipientName: string,
    subject: string,
    messageContent: string
  ): string {
    const templates = {
      SMS: `Hi ${recipientName}, you have a new clarification request: "${subject}". ${messageContent.substring(0, 100)}${messageContent.length > 100 ? '...' : ''}. Please check TrackSphere for details.`,

      EMAIL: `Subject: New Clarification Request: ${subject}

Dear ${recipientName},

You have received a new clarification request:

Subject: ${subject}
Message: ${messageContent}

Please log in to TrackSphere to view the full message and respond.

Best regards,
TrackSphere Team`,

      WHATSAPP: `👋 Hi ${recipientName}!

📝 New clarification request:
*${subject}*

${messageContent.substring(0, 200)}${messageContent.length > 200 ? '...' : ''}

🔗 View in TrackSphere to respond`
    };

    return templates[channel] || '';
  }

  static getNotificationTemplates(): NotificationTemplate[] {
    return [
      {
        channel: 'SMS',
        template: 'Hi {name}, you have a new clarification: "{subject}". {message}',
        description: 'Short SMS notification (160 characters max)'
      },
      {
        channel: 'EMAIL',
        template: 'Dear {name},\n\nYou have a new clarification request:\n\nSubject: {subject}\nMessage: {message}\n\nPlease log in to TrackSphere.',
        description: 'Detailed email notification with full message'
      },
      {
        channel: 'WHATSAPP',
        template: '👋 Hi {name}!\n\n📝 New clarification:\n*{subject}*\n\n{message}',
        description: 'WhatsApp message with formatting'
      }
    ];
  }

  static showDemoNotificationInfo(): string {
    return `
🔔 NOTIFICATION DEMO MODE

This is a demonstration of the notification system. When you select notification channels
(SMS, Email, or WhatsApp) and send a message, the system will:

✅ Log the notification details to the database
✅ Display what would be sent in the browser console
✅ Show notification templates with actual values

❌ NO actual notifications are sent in demo mode

TO ENABLE REAL NOTIFICATIONS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📱 SMS Integration:
   • Use Twilio (https://www.twilio.com/sms)
   • Or AWS SNS (https://aws.amazon.com/sns/)
   • Add TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN to .env
   • Implement in: src/services/notificationService.ts

📧 Email Integration:
   • Use SendGrid (https://sendgrid.com/)
   • Or AWS SES (https://aws.amazon.com/ses/)
   • Add SENDGRID_API_KEY to .env
   • Implement in: src/services/notificationService.ts

💬 WhatsApp Integration:
   • Use Twilio WhatsApp API (https://www.twilio.com/whatsapp)
   • Or WhatsApp Business API
   • Requires approved business account
   • Implement in: src/services/notificationService.ts

INTEGRATION POINTS:
━━━━━━━━━━━━━━━━━
All notification calls are centralized in clarificationService.ts
Search for: "DEMO NOTIFICATION" to find integration points
Replace console.log calls with actual API calls
    `.trim();
  }

  static async sendSMS(to: string, message: string): Promise<void> {
    console.log('📱 SMS Integration Point');
    console.log('To:', to);
    console.log('Message:', message);
    console.log('TODO: Implement Twilio or AWS SNS integration here');
  }

  static async sendEmail(to: string, subject: string, body: string): Promise<void> {
    console.log('📧 Email Integration Point');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Body:', body);
    console.log('TODO: Implement SendGrid or AWS SES integration here');
  }

  static async sendWhatsApp(to: string, message: string): Promise<void> {
    console.log('💬 WhatsApp Integration Point');
    console.log('To:', to);
    console.log('Message:', message);
    console.log('TODO: Implement WhatsApp Business API integration here');
  }
}
