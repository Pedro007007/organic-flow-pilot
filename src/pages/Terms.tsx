import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Terms = () => (
  <div className="min-h-screen bg-background text-foreground">
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
        <ArrowLeft className="h-4 w-4" /> Back to Home
      </Link>

      <h1 className="text-3xl font-bold tracking-tight mb-2">Terms & Conditions</h1>
      <p className="text-sm text-muted-foreground mb-10">Last updated: February 11, 2026</p>

      <div className="prose prose-sm max-w-none space-y-6 text-muted-foreground [&_h2]:text-foreground [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-3 [&_strong]:text-foreground">
        <h2>1. Acceptance of Terms</h2>
        <p>By accessing or using Searchera ("the Service"), you agree to be bound by these Terms & Conditions. If you do not agree to these terms, do not use the Service.</p>

        <h2>2. Description of Service</h2>
        <p>Searchera is an AI-powered SEO management platform that provides keyword discovery, content generation, search performance analytics, and automated optimization through integration with Google Search Console and other tools.</p>

        <h2>3. Account Responsibilities</h2>
        <p>You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate information and to notify us immediately of any unauthorized use of your account. You must be at least 18 years old to use the Service.</p>

        <h2>4. Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Use the Service for any unlawful purpose</li>
          <li>Attempt to gain unauthorized access to any part of the Service</li>
          <li>Use the Service to generate spam or misleading content</li>
          <li>Interfere with or disrupt the Service's infrastructure</li>
          <li>Resell or redistribute the Service without authorization</li>
        </ul>

        <h2>5. Intellectual Property</h2>
        <p>Content you create using the Service remains your property. The Service itself, including its design, features, and underlying technology, is the intellectual property of Searchera and is protected by applicable laws.</p>

        <h2>6. Third-Party Services</h2>
        <p>The Service integrates with third-party services including Google Search Console. Your use of these integrations is subject to the respective third-party terms of service. We are not responsible for the availability or accuracy of third-party services.</p>

        <h2>7. AI-Generated Content</h2>
        <p>The Service uses artificial intelligence to generate content suggestions and SEO recommendations. While we strive for accuracy, AI-generated content may contain errors. You are responsible for reviewing and editing all content before publication.</p>

        <h2>8. Service Availability</h2>
        <p>We aim to provide reliable service but do not guarantee uninterrupted access. We may perform maintenance, updates, or modifications that temporarily affect availability. We will make reasonable efforts to notify you of planned downtime.</p>

        <h2>9. Limitation of Liability</h2>
        <p>To the maximum extent permitted by law, Searchera shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the Service, including but not limited to loss of revenue, data, or search rankings.</p>

        <h2>10. Termination</h2>
        <p>We reserve the right to suspend or terminate your account if you violate these terms. You may terminate your account at any time. Upon termination, your right to use the Service ceases, and we may delete your data in accordance with our Privacy Policy.</p>

        <h2>11. Changes to Terms</h2>
        <p>We may modify these terms at any time. Continued use of the Service after changes constitutes acceptance of the updated terms. We will notify you of material changes via email or through the Service.</p>

        <h2>12. Governing Law</h2>
        <p>These terms are governed by applicable law. Any disputes arising from these terms or your use of the Service shall be resolved through good-faith negotiation before pursuing formal legal remedies.</p>

        <h2>13. Contact</h2>
        <p>For questions about these Terms & Conditions, please contact us through the application's support channels.</p>
      </div>
    </div>
  </div>
);

export default Terms;
