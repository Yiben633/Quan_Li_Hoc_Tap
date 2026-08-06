export type NotificationMessage = { to: string; subject: string; text: string };

export interface NotificationChannel {
  readonly name: string;
  send(message: NotificationMessage): Promise<void>;
}

export class MockEmailChannel implements NotificationChannel {
  readonly name = 'email';
  async send(message: NotificationMessage) {
    if (process.env.NODE_ENV !== 'production') console.info('notification_email_mock', { to: message.to, subject: message.subject });
  }
}

export class MockPushChannel implements NotificationChannel {
  readonly name = 'push';
  async send(message: NotificationMessage) {
    if (process.env.NODE_ENV !== 'production') console.info('notification_push_mock', { to: message.to, subject: message.subject });
  }
}

export const emailChannel: NotificationChannel = new MockEmailChannel();
export const pushChannel: NotificationChannel = new MockPushChannel();
