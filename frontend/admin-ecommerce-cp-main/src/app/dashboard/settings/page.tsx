'use client';

import { Typography, Card } from 'antd';

const { Title, Text } = Typography;

export default function SettingsPage() {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          Settings
        </Title>
        <Text type="secondary">
          Configure system settings, preferences, and admin account details.
        </Text>
      </div>

      <Card>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Title level={4}>Admin Settings</Title>
          <Text type="secondary">
            This page will contain settings functionality including:
            <br />
            • Admin profile management
            <br />
            • System configuration
            <br />
            • Email and notification settings
            <br />
            • Security and password settings
            <br />
            • Theme and appearance preferences
          </Text>
        </div>
      </Card>
    </div>
  );
}
