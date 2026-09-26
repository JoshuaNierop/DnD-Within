// Report button → central Nexus hub (/shared/bugs, project "dnd-within"), plus the
// reviewer-only Changelog. The bug FAB itself stays in the FAB row (renderBugFab in
// ui-settings.js, own colours); it calls reporter.startSelector(). Debug mode
// (profile → Debug Mode, localStorage dw_debug, on by default) shows both.
import { BugReporter } from './bugreport.js';
import { submitToHub } from './central-hub.js';
import { mountChangelog } from './changelog.js';

const PROJECT_ID = 'dnd-within';
const STORAGE_KEY = 'dw_debug';
const APP_VERSION = new URL(import.meta.url).searchParams.get('v');

try {
    if (localStorage.getItem(STORAGE_KEY) === null) localStorage.setItem(STORAGE_KEY, 'true');
} catch (e) { /* storage blocked */ }

const goTo = (route) => {
    if (typeof navigate === 'function' && route && !route.startsWith('http')) navigate(route);
    else if (route) location.assign(route);
};

export const reporter = new BugReporter({
    storageKey: STORAGE_KEY,
    fab: false,
    getUser: () => (typeof currentUserId === 'function' && currentUserId()) || 'anonymous',
    getAppVersion: () => APP_VERSION,
    getTheme: () => 'dark',
    onSubmit: (report) => submitToHub(PROJECT_ID, report),
});

mountChangelog(reporter, { project: PROJECT_ID, repo: 'DnD-Within', owner: 'JoshuaNierop', onNavigate: goTo });

window.BugReportDevMode = { reporter };
window.dispatchEvent(new Event('bugreport:ready'));
