import Dexie from 'dexie'

export const db = new Dexie('caudal')

db.version(1).stores({
  incomes: '++id,date,categoryId,regime,type',
  expenses: '++id,date,categoryId,type',
  categories: '++id,name,kind,isDefault',
  settings: 'key',
})

// v2: agrega cola de sincronización offline
db.version(2).stores({
  incomes: '++id,date,categoryId,regime,type',
  expenses: '++id,date,categoryId,type',
  categories: '++id,name,kind,isDefault',
  settings: 'key',
  syncQueue: '++id,table,operation,status,timestamp',
})

export const resetDatabase = async () => {
  await db.delete()
  await db.open()
}
