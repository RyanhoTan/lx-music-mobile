import { NativeModules } from 'react-native'

interface UtilsModuleType {
  getImageAverageBrightness?: (imageUri: string) => Promise<unknown>
}

const utilsModule = NativeModules.UtilsModule as UtilsModuleType | undefined
const isBrightnessValue = (value: unknown): value is number => typeof value == 'number' && Number.isFinite(value)

export const getPlayerBarImageAverageBrightness = async(imageUri: string): Promise<number | null> => {
  if (!utilsModule?.getImageAverageBrightness) return null
  const result = await utilsModule.getImageAverageBrightness(imageUri)
  return isBrightnessValue(result) ? result : null
}
