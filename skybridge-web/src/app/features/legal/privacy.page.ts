import { Component } from '@angular/core';
import { LegalDocument, LegalSection } from './legal-document';

@Component({
  selector: 'sb-privacy-page',
  imports: [LegalDocument],
  template: `
    <sb-legal-document
      eyebrow="PRIVACY POLICY"
      title="Your data, plainly"
      intro="What we keep about you, why, who else sees it and how to have it deleted. Written to follow Brazil’s General Data Protection Law (LGPD, Law 13.709/2018)."
      [sections]="sections" />
  `
})
export class PrivacyPage {
  protected readonly sections: LegalSection[] = [
    {
      id: 'who',
      title: 'Who we are',
      paragraphs: [
        'SkyBridge Network is a non-commercial virtual airline for flight simulation. The SkyBridge staff decides how the data described here is used and answers for it.'
      ]
    },
    {
      id: 'what',
      title: 'What we keep',
      bullets: [
        'Your name, e-mail and, if you upload one, your profile photo.',
        'Your SimBrief Pilot ID, VATSIM CID and IVAO VID, if you add them.',
        'Your bookings, flights, PIREPs, flight hours and wallet.',
        'The version of the regulations you accepted and when.',
        'Your IP address, in our server logs.'
      ]
    },
    {
      id: 'why',
      title: 'Why we keep it',
      bullets: [
        'To run your account and your career: sign-in, bookings, PIREPs, hours and rewards.',
        'To show the public pages: the last flights show your first name and the initial of your last name; staff members appear with full name, photo and flight numbers.',
        'To count how many SkyBridge pilots are online on VATSIM and IVAO.',
        'To keep the site secure and find problems, using the server logs.'
      ]
    },
    {
      id: 'third-parties',
      title: 'Services we use',
      bullets: [
        'SimBrief: we fetch your latest flight plan with your SimBrief Pilot ID.',
        'CARTO and OpenStreetMap: your browser loads the map tiles from them, so they receive your IP address.',
        'VATSIM and IVAO: we read their public data feeds to know who is online. We do not send them your data.',
        'If VATSIM, IVAO or a future partner asks, we may confirm that you are a SkyBridge pilot.',
        'We do not use Google Analytics or any other tracking, we show no ads and we never sell your data.'
      ]
    },
    {
      id: 'storage',
      title: 'Cookies and storage',
      paragraphs: [
        'We do not use tracking cookies. Your browser only stores your sign-in session and small preferences, such as the theme and whether you have already seen the network ID reminder.'
      ]
    },
    {
      id: 'retention',
      title: 'How long we keep it',
      paragraphs: [
        'Your data stays while your account is active. After 12 months without any activity the account is deleted with its data. Server logs with IP addresses are kept for up to 12 months. When you delete your account, your data is removed immediately.'
      ]
    },
    {
      id: 'rights',
      title: 'Your rights under the LGPD',
      paragraphs: ['Article 18 of the LGPD gives you the right to:'],
      bullets: [
        'Confirm that we process your data and access it.',
        'Correct incomplete, wrong or outdated data. Most of it you can edit yourself in your profile.',
        'Anonymize, block or delete data that is unnecessary or processed against the law.',
        'Take your data to another service (portability).',
        'Delete the data processed with your consent (art. 18, VI), except where the law requires us to keep it (art. 16).',
        'Know with whom we share your data and what happens if you do not give consent.',
        'Withdraw your consent at any time (art. 18, IX). In practice this means deleting your account in Account → Security.'
      ]
    },
    {
      id: 'security',
      title: 'Security',
      paragraphs: [
        'Passwords are stored as secure hashes, never as plain text. The site uses HTTPS, and you can protect your account with two-factor authentication.'
      ]
    },
    {
      id: 'changes',
      title: 'Changes to this policy',
      paragraphs: [
        'This policy changes together with the regulations. We announce changes on Discord and on the site, and ask you to accept them on your next visit.'
      ]
    }
  ];
}