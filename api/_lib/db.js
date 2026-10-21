import { neon } from '@neondatabase/serverless'

export function createDatabaseClient(databaseUrl = process.env.DATABASE_URL) {
  if (typeof databaseUrl !== 'string' || !databaseUrl.trim()) {
    throw new Error('DATABASE_URL 환경변수가 설정되지 않았습니다.')
  }

  return neon(databaseUrl)
}

export async function verifyDatabaseConnection(query = createDatabaseClient()) {
  try {
    const rows = await query`SELECT 1 AS connected`
    return Number(rows[0]?.connected) === 1
  } catch {
    throw new Error('Neon 데이터베이스 연결에 실패했습니다. 연결 설정과 네트워크를 확인해 주세요.')
  }
}
