import { ACTIONS } from '../../utils/permissionConstants';

export const resumeFeature = {
    id: 'resume',
    permissions: {
        actions: [ACTIONS.VIEW, ACTIONS.UPLOAD, ACTIONS.DOWNLOAD, ACTIONS.PUBLISH, ACTIONS.DELETE]
    }
};
