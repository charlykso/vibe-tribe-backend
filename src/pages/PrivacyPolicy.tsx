import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Eye, Database, Mail, Users, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mb-4 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Privacy Policy</h1>
            <p className="text-gray-600 dark:text-gray-300">Last updated: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Introduction */}
        <Card className="mb-6 bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900 dark:text-white">
              <Shield className="h-5 w-5 mr-2 text-blue-600" />
              Introduction
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 dark:text-gray-300">
            <p className="mb-4">
              Welcome to Tribe ("we," "our," or "us"). We are committed to protecting your privacy and ensuring
              the security of your personal information. This Privacy Policy explains how we collect, use, disclose,
              and safeguard your information when you use our social media management platform.
            </p>
            <p>
              By using Tribe, you agree to the collection and use of information in accordance with this policy.
            </p>
          </CardContent>
        </Card>

        {/* Information We Collect */}
        <Card className="mb-6 bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900 dark:text-white">
              <Database className="h-5 w-5 mr-2 text-green-600" />
              Information We Collect
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 dark:text-gray-300 space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Personal Information</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Name and email address</li>
                <li>Profile information and avatar</li>
                <li>Organization details</li>
                <li>Communication preferences</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Social Media Data</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Connected social media account information</li>
                <li>Posts, comments, and engagement data</li>
                <li>Analytics and performance metrics</li>
                <li>Scheduled content and drafts</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Usage Information</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Log data and IP addresses</li>
                <li>Device information and browser type</li>
                <li>Feature usage and interaction patterns</li>
                <li>Performance and error data</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* How We Use Information */}
        <Card className="mb-6 bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900 dark:text-white">
              <Eye className="h-5 w-5 mr-2 text-purple-600" />
              How We Use Your Information
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 dark:text-gray-300">
            <p className="mb-4">We use the collected information for the following purposes:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Provide and maintain our social media management services</li>
              <li>Process and schedule your social media posts</li>
              <li>Generate analytics and insights for your content</li>
              <li>Facilitate team collaboration and communication</li>
              <li>Send important notifications and updates</li>
              <li>Improve our platform and develop new features</li>
              <li>Ensure security and prevent fraud</li>
              <li>Comply with legal obligations</li>
            </ul>
          </CardContent>
        </Card>

        {/* Information Sharing */}
        <Card className="mb-6 bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900 dark:text-white">
              <Users className="h-5 w-5 mr-2 text-orange-600" />
              Information Sharing and Disclosure
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 dark:text-gray-300">
            <p className="mb-4">We do not sell, trade, or rent your personal information. We may share information in the following circumstances:</p>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>With your consent:</strong> When you explicitly authorize us to share information</li>
              <li><strong>Service providers:</strong> With trusted third-party services that help us operate our platform</li>
              <li><strong>Social media platforms:</strong> When you connect and authorize posting to your social accounts</li>
              <li><strong>Legal requirements:</strong> When required by law or to protect our rights and users</li>
              <li><strong>Business transfers:</strong> In connection with mergers, acquisitions, or asset sales</li>
            </ul>
          </CardContent>
        </Card>

        {/* Data Security */}
        <Card className="mb-6 bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900 dark:text-white">
              <Lock className="h-5 w-5 mr-2 text-red-600" />
              Data Security
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 dark:text-gray-300">
            <p className="mb-4">We implement appropriate security measures to protect your information:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security audits and monitoring</li>
              <li>Access controls and authentication</li>
              <li>Secure cloud infrastructure</li>
              <li>Employee training on data protection</li>
            </ul>
            <p className="mt-4">
              However, no method of transmission over the internet is 100% secure. While we strive to protect 
              your information, we cannot guarantee absolute security.
            </p>
          </CardContent>
        </Card>

        {/* Your Rights */}
        <Card className="mb-6 bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900 dark:text-white">
              <Shield className="h-5 w-5 mr-2 text-blue-600" />
              Your Rights and Choices
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 dark:text-gray-300">
            <p className="mb-4">You have the following rights regarding your personal information:</p>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and data</li>
              <li><strong>Portability:</strong> Export your data in a machine-readable format</li>
              <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
              <li><strong>Restriction:</strong> Limit how we process your information</li>
            </ul>
            <p className="mt-4">
              To exercise these rights, please contact us at privacy@tribe.com or use the account
              deletion feature in your settings.
            </p>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="mb-6 bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900 dark:text-white">
              <Mail className="h-5 w-5 mr-2 text-indigo-600" />
              Contact Us
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 dark:text-gray-300">
            <p className="mb-4">
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="space-y-2">
              <p><strong>Email:</strong> privacy@tribe.com</p>
              <p><strong>Support:</strong> support@tribe.com</p>
              <p><strong>Address:</strong> Tribe Inc., 123 Privacy Street, Data City, DC 12345</p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-gray-500 dark:text-gray-400 text-sm">
          <p>© 2024 Tribe. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};
