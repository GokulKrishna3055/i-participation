// A fresh channel per document prevents duplicated tabs from sharing auth events.
// The underlying sessionStorage slot remains stable across reloads in this tab.
export function createTabSession(storage: Storage, channelId: string) {
  let id = storage.getItem("ipp26-tab-id");
  if (!id) {
    id = channelId;
    storage.setItem("ipp26-tab-id", id);
  }
  const persistedKey = `ipp26-auth-${id}`;
  const storageKey = `${persistedKey}-${channelId}`;
  return {
    storageKey,
    storage: {
      getItem: (key: string) => storage.getItem(key === storageKey ? persistedKey : key),
      setItem: (key: string, value: string) => storage.setItem(key === storageKey ? persistedKey : key, value),
      removeItem: (key: string) => storage.removeItem(key === storageKey ? persistedKey : key),
    },
  };
}