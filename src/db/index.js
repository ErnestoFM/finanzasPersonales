import Dexie from 'dexie'

export const db = new Dexie('caudal')

db.version(1).stores({
  incomes: '++id,date,categoryId,regime,type',
  expenses: '++id,date,categoryId,type',
  categories: '++id,name,kind,isDefault',
  settings: 'key',
})

export const resetDatabase = async () => {
  await db.delete()
  await db.open()
}
