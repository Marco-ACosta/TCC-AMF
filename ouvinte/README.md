# Projeto Mobile TCC Marco

## Inicialização do Projeto

Intalar as dependências:  
`npm i`

## Cuidados com o Projeto

Verificar sempre que possível as seguintes questões:

#### Atualizações de Dependências
rodar `npm outdated` e validar dependências desatualizadas.  

#### Verificações EXPO
rodar `npx expo-doctor` após grandes atualizações para corrigir problemas com o projeto.
rodar `npx expo install --check` para verificar atualizações de dependências EXPO.

## Android

Para a geração ou atualização da pasta `android`, rode `npx expo prebuild`.

#### Build de Desenvolvimento

`eas build --platform android --profile development --local`

#### Build de Preview

`eas build --platform android --profile preview --local`

#### Build de Production

`eas build --platform android --profile production --local`

### iOS

Para buildar o app em um dispositivo iOS rode: `npx expo run:ios`
