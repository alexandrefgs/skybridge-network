import { Component } from '@angular/core';
import { LegalDocument, LegalSection } from './legal-document';

@Component({
  selector: 'sb-regulations-page',
  imports: [LegalDocument],
  template: `
    <sb-legal-document
      eyebrow="REGULATIONS"
      title="Flying with SkyBridge"
      intro="The rules every SkyBridge pilot agrees to. They keep the network fair, fun and respectful for everyone in the virtual sky."
      [sections]="sections"
      [showHistory]="true" />
  `
})
export class RegulationsPage {
  protected readonly sections: LegalSection[] = [
    {
      id: 'about',
      title: 'About these rules',
      paragraphs: [
        'SkyBridge Network is a virtual airline for flight simulation. It is not a real airline and has no link with the real companies whose schedules and names appear on the site.',
        'Every change to these regulations gets a new version. We announce it on our Discord server and, the next time you visit the site, you will see what changed and be asked to accept it. If you decline, your account is deleted, after a confirmation, because every pilot must follow the current rules.'
      ]
    },
    {
      id: 'joining',
      title: 'Joining',
      bullets: [
        'You must be at least 16 years old.',
        'All you need is an account. One account per person.',
        'On your first visit we ask for your VATSIM CID and your IVAO VID. They are optional, but without them we cannot show you as online on the networks.',
        'Keep your e-mail up to date and protect your password. We strongly recommend two-factor authentication.'
      ]
    },
    {
      id: 'flying',
      title: 'Where and how you fly',
      bullets: [
        'Any flight simulator is welcome: Microsoft Flight Simulator, X-Plane, Prepar3D and others.',
        'Online flights on VATSIM or IVAO and offline flights count the same.',
        'When flying online, follow the rules of the network and the instructions of its controllers. Their sanctions are independent from ours.'
      ]
    },
    {
      id: 'career',
      title: 'Your career',
      paragraphs: [
        'Your logged flight hours are your career. Every aircraft category needs a minimum number of hours, so you start with light aircraft and unlock bigger ones as you fly.'
      ],
      bullets: [
        'Freelance: missions such as medevac, cargo, repatriation and air taxi, each with a fixed reward.',
        'Executive: charters for executives in light and mid-size jets, usually with several legs.',
        'Regional: turboprops on short runways and smaller towns.',
        'Major airlines: real schedules from real airlines, paid per flight hour. On an airline route you may fly any aircraft of the same family the airline operates.',
        'You can change between these at any time. Your hours and wallet go with you.'
      ]
    },
    {
      id: 'pireps',
      title: 'Flight reports (PIREPs)',
      bullets: [
        'Every flight needs a SimBrief flight plan (OFP) that matches the booked origin, destination and aircraft.',
        'File your PIREP honestly. Times, fuel and landing rate must come from the flight you actually flew.',
        'Slew mode, time acceleration, teleporting or editing the aircraft position are not allowed.',
        'Flights that look unusual, for example too short for the distance, are sent to the staff for review.',
        'A rejected flight does not pay and does not count hours. The staff explains why in the review note.'
      ]
    },
    {
      id: 'conduct',
      title: 'Conduct',
      bullets: [
        'Treat pilots, staff and controllers with respect, on the site, on Discord and on the networks.',
        'No offensive, discriminatory or violent content, and no pirated software, add-ons or other illegal content on our Discord.',
        'Do not use the SkyBridge name, logo or identity, or speak on its behalf, without the staff’s permission.',
        'Depending on how serious it is, breaking these rules leads to a warning, a suspension or the exclusion of the account. You can ask the staff to review a decision on Discord.'
      ]
    },
    {
      id: 'inactivity',
      title: 'Inactivity',
      bullets: [
        'After 60 days without visiting the site, your account becomes inactive.',
        'The next time you sign in you can reactivate it for free. It takes about 10 minutes while we prepare your account, and your logbook, hours and wallet stay the same.',
        'Accounts without any activity for 12 months are deleted, together with their data.'
      ]
    },
    {
      id: 'leaving',
      title: 'Leaving SkyBridge',
      paragraphs: [
        'You can delete your account at any time in Account → Security. The deletion is immediate and permanent: your profile, flights, PIREPs, wallet and staff role cannot be recovered.'
      ]
    }
  ];
}