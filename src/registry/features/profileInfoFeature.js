import { ACTIONS } from '../../utils/permissionConstants';

/**
 * Professional Profile content section.
 *
 * Recruiter-facing facts (summary, current role, availability, work types,
 * languages, etc.) stored in the `content/profileInfo` document and edited
 * inside the General tab alongside Home/About/Contact. Distinct module id from
 * the account `profile` tab. No nav entry and no contentType — it is a
 * single-doc content section, not a CRUD collection. Server writes ride the
 * dynamic `content/{document=**}` rule (`canWriteModule('general')`).
 */
export const profileInfoFeature = {
    id: 'profileInfo',
    permissions: {
        actions: [ACTIONS.EDIT, ACTIONS.VIEW_HISTORY]
    }
};
