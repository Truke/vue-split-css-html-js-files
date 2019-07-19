export function replaceGSLS(data){
  try {
    let stringData = JSON.stringify(data);
    stringData = stringData.replace(/融小鱼|rxy|RXY/g,'GSLS')
    return JSON.parse(stringData)
  } catch (error) {
    return data
  }
}