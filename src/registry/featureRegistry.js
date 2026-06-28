import { blogFeature } from './features/blogFeature';
import { projectsFeature } from './features/projectsFeature';
import { experienceFeature } from './features/experienceFeature';
import { skillsFeature } from './features/skillsFeature';
import { certificatesFeature } from './features/certificatesFeature';
import { educationFeature } from './features/educationFeature';
import { dashboardFeature } from './features/dashboardFeature';
import { settingsFeature } from './features/settingsFeature';
import { messagesFeature } from './features/messagesFeature';
import { databaseFeature } from './features/databaseFeature';
import { usersFeature } from './features/usersFeature';
import { auditFeature } from './features/auditFeature';
import { analyticsFeature } from './features/analyticsFeature';
import { generalFeature } from './features/generalFeature';
import { homeFeature } from './features/homeFeature';
import { aboutFeature } from './features/aboutFeature';
import { contactFeature } from './features/contactFeature';
import { profileFeature } from './features/profileFeature';

/**
 * Feature Module Registry
 * 
 * All feature modules are registered here. The rest of the application
 * (navigation, permissions, search, dashboard) dynamically derives its
 * capabilities by querying this registry.
 */
export const FEATURES = [
    dashboardFeature,
    generalFeature,
    educationFeature,
    experienceFeature,
    projectsFeature,
    skillsFeature,
    certificatesFeature,
    blogFeature,
    messagesFeature,
    databaseFeature,
    usersFeature,
    auditFeature,
    analyticsFeature,
    settingsFeature,
    profileFeature,
    homeFeature,
    aboutFeature,
    contactFeature
];

const byId = Object.fromEntries(FEATURES.map((f) => [f.id, f]));

export const listFeatures = () => FEATURES;
export const getFeature = (id) => byId[id] || null;
export const isFeature = (id) => Boolean(byId[id]);
