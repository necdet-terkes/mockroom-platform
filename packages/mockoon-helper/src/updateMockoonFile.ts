import fs from 'fs-extra'

export const addMock = async (filePath: string, mockData: any) => {
  const env = await fs.readJSON(filePath)
  env.routes.push(mockData)
  await fs.writeJSON(filePath, env, { spaces: 2 })
  return true
}
