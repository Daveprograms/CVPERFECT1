export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
      <div className="prose dark:prose-invert max-w-none">
        <p>
          At CVPerfect, we take your privacy seriously. We protect your data like it's our own, ensuring that your personal information and resume data are secure and handled with the utmost care.
        </p>
        <h2>Data Collection</h2>
        <p>
          We collect only the information necessary to provide you with our services. This includes:
        </p>
        <ul>
          <li>Account information (email, name)</li>
          <li>Resume content and history</li>
          <li>Usage data to improve our services</li>
        </ul>
        <h2>Data Protection</h2>
        <p>
          Your data is encrypted and stored securely. We never share your personal information with third parties without your explicit consent.
        </p>
        <h2>Your Rights</h2>
        <p>
          You have the right to:
        </p>
        <ul>
          <li>Access your personal data</li>
          <li>Request data deletion</li>
          <li>Export your data</li>
          <li>Opt-out of marketing communications</li>
        </ul>
      </div>
    </div>
  )
} 