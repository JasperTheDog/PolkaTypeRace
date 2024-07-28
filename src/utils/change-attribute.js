export const changeAttribute = (token, attributeToChange, newValue) => {
  const tokenDataProp = token.properties.find(p => p.key === 'tokenData');
  if(!tokenDataProp) throw Error('Cannot parse tokenData property');
  let tokenDataValue = JSON.parse(tokenDataProp.value);

  if (!tokenDataValue.attributes)
    throw Error('Cannot parse attributes');

  const targetAttributeIndex = tokenDataValue.attributes.findIndex(a => a.trait_type === attributeToChange);
  if (targetAttributeIndex === -1)
    throw Error('Cannot parse attribute to change');

  tokenDataValue.attributes[targetAttributeIndex] = {
    trait_type: attributeToChange,
    value: newValue,
  }

  return JSON.stringify(tokenDataValue);
}