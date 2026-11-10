// IndexedDB save storage. The app owns JSON validation and presentation of errors.
// Every instance must load before writing; revisions detect another tab's writes.
export class StorageUnavailableError extends Error { constructor(message='端末の保存領域を利用できません。', options){super(message,options);this.name='StorageUnavailableError';} }
export class StorageConflictError extends Error { constructor(){super('別の画面で記録が更新されました。最新の記録を確認してください。');this.name='StorageConflictError';} }
export class StorageRecoveryRequiredError extends Error { constructor(){super('保存先の記録が見つかりません。古い記録を自動で読み込まず、復旧の確認が必要です。');this.name='StorageRecoveryRequiredError';} }
export class StorageValidationError extends Error { constructor(message='以前の記録を確認できませんでした。',options){super(message,options);this.name='StorageValidationError';} }
export class StorageNotLoadedError extends Error { constructor(){super('保存する前に記録を読み込んでください。');this.name='StorageNotLoadedError';} }

const STORE='saves', KEY='current';
export function createStorage({dbName='docporo-save-v1',legacyKey='poro-medical-year-v1',validateLegacy,indexedDB: suppliedDb,localStorage: suppliedLocal}={}) {
  let loaded=false, recovery=false, revision=null, connection=null, queue=Promise.resolve();
  const markerKey=legacyKey+':indexeddb-migrated-v1';
  // Reject failed operations to the caller without poisoning the queue.
  function serial(work){const result=queue.then(work);queue=result.catch(()=>{});return result;}
  function local(){try{const value=suppliedLocal ?? globalThis.localStorage;if(!value)throw Error('localStorage unavailable');return value;}catch(cause){throw new StorageUnavailableError(undefined,{cause});}}
  function marker(){try{return local().getItem(markerKey) !== null;}catch(cause){if(cause instanceof StorageUnavailableError)throw cause;throw new StorageUnavailableError(undefined,{cause});}}
  function mark(){try{local().setItem(markerKey,'1');}catch(cause){if(cause instanceof StorageUnavailableError)throw cause;throw new StorageUnavailableError(undefined,{cause});}}
  function legacy(){try{return local().getItem(legacyKey);}catch(cause){if(cause instanceof StorageUnavailableError)throw cause;throw new StorageUnavailableError(undefined,{cause});}}
  function open(){
    if(connection)return Promise.resolve(connection);
    return new Promise((resolve,reject)=>{
      let settled=false, req;
      try{const db=suppliedDb ?? globalThis.indexedDB;if(!db)throw Error('IndexedDB unavailable');req=db.open(dbName,1);}
      catch(cause){reject(new StorageUnavailableError(undefined,{cause}));return;}
      req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE);};
      req.onerror=()=>{if(!settled){settled=true;reject(new StorageUnavailableError(undefined,{cause:req.error}));}};
      req.onblocked=()=>{if(!settled){settled=true;reject(new StorageUnavailableError('保存先が別の画面で使用中です。'));}};
      req.onsuccess=()=>{if(settled){req.result.close();return;}settled=true;const db=req.result;connection=db;db.onversionchange=()=>{db.close();if(connection===db)connection=null;};db.onclose=()=>{if(connection===db)connection=null;};resolve(db);};
    });
  }
  function transact(db, mode, operation){
    return new Promise((resolve,reject)=>{
      let tx, result, reason;
      try{
        tx=db.transaction(STORE,mode);
        const store=tx.objectStore(STORE);
        operation(store, value=>{result=value;}, error=>{reason=error;try{tx.abort();}catch{}});
      }catch(cause){reject(new StorageUnavailableError(undefined,{cause}));return;}
      tx.oncomplete=()=>resolve(result);
      tx.onabort=()=>reject(reason||new StorageUnavailableError(undefined,{cause:tx.error}));
      tx.onerror=()=>{}; // onabort reports the failed transaction once.
    });
  }
  function check(record){
    if(record===undefined)return null;
    if(!record||typeof record!=='object'||typeof record.revision!=='string'||!/^[0-9a-f]{32}$/.test(record.revision)||typeof record.deleted!=='boolean'||(!record.deleted&&typeof record.value!=='string'))throw new StorageRecoveryRequiredError();
    return record;
  }
  async function read(db){return check(await transact(db,'readonly',(store,done)=>{const request=store.get(KEY);request.onsuccess=()=>done(request.result);}));}
  function newRevision(){
    try{const bytes=new Uint8Array(16);globalThis.crypto.getRandomValues(bytes);return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');}
    catch(cause){throw new StorageUnavailableError('保存の識別情報を作成できません。',{cause});}
  }
  async function write(db,expected,value,deleted){
    const nextRevision=newRevision();
    return transact(db,'readwrite',(store,done,fail)=>{
      const request=store.get(KEY);
      request.onsuccess=()=>{
        let old;try{old=check(request.result);}catch(error){fail(error);return;}
        if((old?.revision??null)!==expected){fail(new StorageConflictError());return;}
        const next={revision:nextRevision,deleted};if(!deleted)next.value=value;
        store.put(next,KEY);done(next);
      };
    });
  }
  async function loadImpl(){
    loaded=false;recovery=false;
    const db=await open(), existing=await read(db);
    if(existing){mark();revision=existing.revision;loaded=true;return existing.deleted?null:existing.value;}
    if(marker()){recovery=true;throw new StorageRecoveryRequiredError();}
    const old=legacy();
    if(old===null){revision=null;loaded=true;return null;}
    if(typeof validateLegacy!=='function'){recovery=true;throw new StorageValidationError('以前の記録を検証できません。');}
    try{if(validateLegacy(old)===false)throw Error('invalid legacy save');}catch(cause){recovery=true;throw new StorageValidationError(undefined,{cause});}
    // Mark first: interruption or a failed transaction must never silently roll back.
    mark();
    const migrated=await write(db,null,old,false);revision=migrated.revision;loaded=true;return migrated.value;
  }
  async function saveImpl(value,deleted){
    if(!loaded)throw new StorageNotLoadedError();
    if(!deleted&&typeof value!=='string')throw new TypeError('セーブデータは文字列で指定してください。');
    const db=await open();mark();const next=await write(db,revision,value,deleted);revision=next.revision;
  }
  return {
    load:()=>serial(loadImpl),
    save:value=>serial(()=>saveImpl(value,false)),
    remove:()=>serial(()=>saveImpl(null,true)),
    // Explicit recovery accepts a user-selected, app-validated backup only.
    recover:value=>serial(async()=>{
      if(!recovery)throw new StorageNotLoadedError();
      if(typeof value!=='string')throw new TypeError('セーブデータは文字列で指定してください。');
      const db=await open();mark();const next=await write(db,null,value,false);
      revision=next.revision;loaded=true;recovery=false;
    }),
    close:()=>serial(()=>{connection?.close();connection=null;loaded=false;recovery=false;})
  };
}
