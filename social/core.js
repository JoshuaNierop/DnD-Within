// social/core.js — canonical types + helpers, datastore-agnostic.

export function chatIdFor(uidA, uidB) {
    return [uidA, uidB].sort().join('__');
}

export function emailSlug(email) {
    const lower = String(email || '').trim().toLowerCase();
    if (!lower) return '';
    // base64url, no padding — Firebase-safe key
    const b64 = btoa(unescape(encodeURIComponent(lower)));
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function otherMemberUid(chatId, myUid) {
    const [a, b] = String(chatId).split('__');
    return a === myUid ? b : a;
}

export function formatRelativeTime(ts) {
    if (!ts) return '';
    const diff = Date.now() - ts;
    if (diff < 60_000) return 'now';
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
    if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)}d`;
    return new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
}

export function escHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

/**
 * Adapter contract — all UI modules in social/ expect this interface.
 *
 * @typedef {Object} SocialAdapter
 * @property {() => string} getCurrentUid
 * @property {() => Promise<{uid:string,displayName:string,email:string}>} getMyProfile
 * @property {() => Promise<void>} ensureMyLookup           register email→uid lookup for myself
 * @property {(email:string) => Promise<{uid,displayName,email}|null>} findUserByEmail
 * @property {(uid:string) => Promise<{uid,displayName,email}|null>} getProfile
 *
 * @property {() => Promise<Friend[]>} listFriends
 * @property {() => Promise<Friend[]>} listIncoming
 * @property {(toUid:string,toProfile:object,message?:string) => Promise<void>} sendFriendRequest
 * @property {(fromUid:string) => Promise<void>} acceptFriendRequest
 * @property {(fromUid:string) => Promise<void>} declineFriendRequest
 * @property {(uid:string) => Promise<void>} removeFriend
 * @property {(callback:Function) => Function} subscribeFriends     returns unsubscribe
 *
 * @property {() => Promise<ChatMeta[]>} listChats
 * @property {(chatId:string,opts?:{limit?:number}) => Promise<Message[]>} loadMessages
 * @property {(chatId:string,otherUid:string,text:string) => Promise<void>} sendMessage
 * @property {(chatId:string) => Promise<void>} markRead
 * @property {(callback:Function) => Function} subscribeChatList     returns unsubscribe
 * @property {(chatId:string,callback:Function) => Function} subscribeMessages
 *
 * @typedef {Object} Friend
 * @property {string} uid
 * @property {string} displayName
 * @property {string} email
 * @property {'pending'|'accepted'|'blocked'} status
 * @property {number} since
 *
 * @typedef {Object} ChatMeta
 * @property {string} chatId
 * @property {string} otherUid
 * @property {string} otherDisplayName
 * @property {string} lastMessage
 * @property {number} lastTs
 * @property {string} lastFrom
 * @property {number} unread
 *
 * @typedef {Object} Message
 * @property {string} id
 * @property {string} from
 * @property {string} text
 * @property {number} ts
 */

export const ADAPTER_REQUIRED_METHODS = [
    'getCurrentUid', 'getMyProfile', 'ensureMyLookup',
    'findUserByEmail', 'getProfile',
    'listFriends', 'listIncoming', 'sendFriendRequest',
    'acceptFriendRequest', 'declineFriendRequest', 'removeFriend',
    'subscribeFriends',
    'listChats', 'loadMessages', 'sendMessage', 'markRead',
    'subscribeChatList', 'subscribeMessages',
];

export function validateAdapter(adapter) {
    const missing = ADAPTER_REQUIRED_METHODS.filter(m => typeof adapter?.[m] !== 'function');
    if (missing.length) {
        throw new Error(`SocialAdapter mist methods: ${missing.join(', ')}`);
    }
    return true;
}
