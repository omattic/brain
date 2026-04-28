import * as crypto from 'crypto';
import { get, put } from "brain-sdk"

export async function getAliases(scope: string, path: string, existingKey: string): Promise<string[]> {
  let keys = await get(`${path}/${existingKey}`) || []

  keys.push(existingKey)
  
  return removeDoublesInArray(keys) // [existingKey, ...keys] //keys.filter((key: string) => key !== socialKey)
}

function removeDoublesInArray(array: string[]) {
  return array.filter((item, index) => array.indexOf(item) === index)
}

export async function addAlias(scope: string, path: string, existingKey: string, newKey: string) {
  console.log("🛂  addAlias", scope, path, existingKey, newKey)

  let existingAliases = await getAliases(scope, path, existingKey)
  console.log("existingAliases", existingAliases)

  let allLinkedAliases = await Promise.all(existingAliases.map(getAliases.bind(null, scope, path))) as string[][]
  console.log("allLinkedAliases1", allLinkedAliases)
  existingAliases = existingAliases.concat(allLinkedAliases.flat())
  console.log("existingAliases2", existingAliases)

  existingAliases.push(existingKey)
  existingAliases.push(newKey)
  console.log("existingAliases3", existingAliases)

  existingAliases = removeDoublesInArray(existingAliases) as string[]
  console.log("existingAliases4", existingAliases)

  await Promise.all(existingAliases.map(async (socialAlias: string) => {
    console.log("put", `${path}/${socialAlias}`, existingAliases)
    return await put(`${path}/${socialAlias}`, existingAliases)
  }))
  return existingAliases
}

export async function retrieveAllAliases(scope: string, path: string, xidsList: string[]) {
  let allXidsAliases = await Promise.all(xidsList.map(async (xid: string) => {
    console.log("🛂 GET ALIASES FOR", xid)
    return await getAliases(scope, path, xid) as string[]
  }))

  console.log("allXidsAliases", allXidsAliases)

  let allJoinedTogether = removeDoublesInArray(allXidsAliases.flat(2))

  // boolean check all elements have the same length as all joined together
  let allHaveSameLength = allXidsAliases.every((xidsAliases: string[]) => xidsAliases.length === allJoinedTogether.length)

  if (allHaveSameLength) {
    return allJoinedTogether
  } else {
    await Promise.all(allJoinedTogether.map(async (eachAlias: string) => {
      console.log("put", `${path}/${eachAlias}`, allJoinedTogether)
      return await put(`${path}/${eachAlias}`, allJoinedTogether)
    }))
  }

  return allJoinedTogether

}


export function microHash(input: string): string {
  let hashSize = 4
  // Hash the input string using SHA-256
  const hash = crypto.createHash('sha256').update(input).digest('hex');

  // Convert the hash to a base-36 string
  let base36Hash = BigInt('0x' + hash).toString(36);

  // Ensure the result is exactly five characters long
  if (base36Hash.length > hashSize) {
    base36Hash = base36Hash.substring(0, hashSize);
  } else if (base36Hash.length < hashSize) {
    base36Hash = base36Hash.padStart(hashSize, '0');
  }

  return "X" + base36Hash.toUpperCase();
}


if (typeof require !== "undefined" && typeof module !== "undefined" && require.main === module) {
  (async () => {
    // console.log(microHash('i:17841401707784079'))

    // addSocialAlias("carlitos", "carkis").then(console.log)
    // addSocialAlias("gnu", "warrior").then(console.log)
    // getAliases("social", "aliases", "gnu").then(console.log)
    let t = "3"
    // await addAlias("social", "aliases", 'd:XDDD13', "c:XCCC1" + t)
    // await sleep(1000)

    // await addAlias("social", "aliases", "b:XBBB1" + t, "c:XCCC1" + t)
    // await sleep(1000)

    // await addAlias("social", "aliases", "c:XCCC1" + t, "d:XDDD1" + t)
    // getAliases("social", "aliases", "XAAAA").then(console.log)

    // addAlias("social", "aliases", "uu:123123", "t:testcarlos44").then(console.log)
    // await sleep(1000)
    // getAliases("social", "aliases", "c:XCCC1" + t).then(console.log)
    // retrieveAllAliases("social", "aliases", ["XTCCC1" + t, "b:XBBB1" + t]).then(console.log)

  })()
}
