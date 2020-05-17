import { getAllFragmentNames, getFragment, getCollectionName, getCollection, Collections } from '../../lib/vulcan-lib';
import { generatedFileHeader, assert, simplSchemaTypeToTypescript, graphqlTypeToTypescript } from './typeGenerationUtils';

const fragmentFileHeader = generatedFileHeader+`//
// Contains Typescript signatures for fragments, generated by
// server/codegen/generateFragmentTypes.ts.
//
`

export function generateFragmentTypes(): string {
  const fragmentNames: Array<string> = getAllFragmentNames();
  const sb: Array<string> = [];
  
  for (let fragmentName of fragmentNames) {
    sb.push(generateFragmentTypeDefinition(fragmentName));
  }
  
  sb.push(generateFragmentsIndexType());
  sb.push(generateCollectionNamesIndexType());
  
  return fragmentFileHeader + sb.join('');
}

function generateFragmentTypeDefinition(fragmentName: string): string {
  const fragmentDefinitions = getFragment(fragmentName);
  
  // `getFragment` returns the parsed definition of a fragment plus all of its
  // dependency fragments. The one we requested will be first.
  assert(fragmentDefinitions.definitions.length > 0);
  const parsedFragment = fragmentDefinitions.definitions[0];
  assert(parsedFragment.kind == "FragmentDefinition");
  assert(parsedFragment.name.value == fragmentName);
  
  // Get the name of the type this fragment refers to
  const typeName = parsedFragment.typeCondition?.name?.value;
  const collectionName = getCollectionName(typeName);
  const collection = getCollection(collectionName);
  assert(collection);
  
  return fragmentToInterface(fragmentName, parsedFragment, collection);
}

function generateFragmentsIndexType(): string {
  const fragmentNames: Array<string> = getAllFragmentNames();
  const sb: Array<string> = [];
  
  sb.push('interface FragmentTypes {\n');
  for (let fragmentName of fragmentNames) {
    sb.push(`  ${fragmentName}: ${fragmentName}\n`);
  }
  sb.push('}\n\n');
  
  return sb.join('');
}

function generateCollectionNamesIndexType(): string {
  return 'type CollectionNameString = ' + Collections.map(c => `"${c.collectionName}"`).join('|') + '\n\n';
}

function fragmentToInterface(interfaceName: string, parsedFragment, collection): string {
  const sb: Array<string> = [];
  
  const spreadFragments = getSpreadFragments(parsedFragment);
  const inheritanceStr = spreadFragments.length>0 ? ` extends ${spreadFragments.join(', ')}` : "";
  
  sb.push(`interface ${interfaceName}${inheritanceStr} { // fragment on ${collection.collectionName}\n`);
  
  const allSubfragments: Array<string> = [];
  for (let selection of parsedFragment.selectionSet.selections) {
    switch(selection.kind) {
      case "Field":
        const { fieldType, subfragment } = getFragmentFieldType(interfaceName, selection, collection)
        sb.push(`  readonly ${selection.name.value}: ${fieldType},\n`);
        if (subfragment)
          allSubfragments.push(subfragment);
        break;
      case "FragmentSpread":
        break;
      default:
        sb.push(`  UNRECOGNIZED: ${selection.kind}\n`);
        break;
    }
  }
  
  sb.push('}\n\n');
  for (let subfragment of allSubfragments)
    sb.push(subfragment);
  return sb.join('');
}

function getSpreadFragments(parsedFragment): Array<string> {
  const spreadFragmentNames: Array<string> = [];
  for (let selection of parsedFragment.selectionSet.selections) {
    if(selection.kind == "FragmentSpread") {
      spreadFragmentNames.push(selection.name.value);
    }
  }
  return spreadFragmentNames;
}

function getFragmentFieldType(fragmentName: string, parsedFragmentField, collection):
  { fieldType: string, subfragment: string|null }
{
  const fieldName = parsedFragmentField.name.value;
  if (fieldName == "__typename") {
    return { fieldType: "string", subfragment: null };
  }
  const schema = collection.simpleSchema()._schema;
  
  // There are two ways a field name can appear in a schema. The first is as a
  // regular field with that name. The second is as a resolver with that name,
  // which may be attached to a field with the same name or a different name.
  // If there's a resolver, it takes precedence.
  
  let fieldType: string|null = null;
  
  // Check for a field with a resolver by this name
  for (let schemaFieldName of Object.keys(schema)) {
    const fieldWithResolver = schema[schemaFieldName];
    if (fieldWithResolver?.resolveAs?.fieldName == fieldName) {
      assert(fieldWithResolver.resolveAs.type);
      fieldType = graphqlTypeToTypescript(fieldWithResolver.resolveAs.type);
      break;
    }
  }
  
  // Check for regular presence in the schema
  if (!fieldType) {
    if (fieldName in schema) {
      assert(schema[fieldName].type);
      if (schema[fieldName]?.resolveAs?.type && !schema[fieldName]?.resolveAs?.fieldName) {
        fieldType = graphqlTypeToTypescript(schema[fieldName].resolveAs.type);
      } else {
        fieldType = simplSchemaTypeToTypescript(schema, fieldName, schema[fieldName].type);
      }
    }
  }
  
  // If neither found, error (fragment contains a field that isn't in the schema)
  if (!fieldType) {
    throw new Error(`Fragment ${fragmentName} contains field ${fieldName} on type ${collection.collectionName} which is not in the schema`);
  }
  
  // Now check if the field has a sub-selector
  if (parsedFragmentField.selectionSet?.selections?.length > 0) {
    // As a special case, if the sub-selector spreads a fragment and has no
    // other fields, use that fragment's type
    if (parsedFragmentField.selectionSet.selections.length == 1
      && parsedFragmentField.selectionSet.selections[0].kind == "FragmentSpread")
    {
      const subfragmentName = parsedFragmentField.selectionSet.selections[0].name.value;
      return {
        fieldType: getFragmentTypeFieldType(fieldType, subfragmentName),
        subfragment: null,
      };
    }
    else
    {
      if (typeof fieldType !== "string") throw new Error("fieldType is not a string: was "+JSON.stringify(fieldType));
      const collectionName = getCollectionNameFromType(fieldType)
      const subfieldCollection = getCollection(collectionName);
      if (!subfieldCollection) {
        // eslint-disable-next-line no-console
        console.log(`Field ${fieldName} in fragment ${fragmentName} has type ${fieldType} which does not identify a collection (${collectionName})`);
        //throw new Error(`Field ${fieldName} in fragment ${fragmentName} has type ${fieldType} which does not identify a collection`);
        return {
          fieldType: "any", subfragment: null
        };
      }
      const subfragmentName = `${fragmentName}_${fieldName}`;
      const subfragment = fragmentToInterface(subfragmentName, parsedFragmentField, subfieldCollection);
      
      // If it's an array type, then it's an array of that subfragment. Otherwise it's an instance of that subfragmetn.
      return {
        fieldType: getFragmentTypeFieldType(fieldType, subfragmentName),
        subfragment: subfragment,
      };
    }
  } else {
    return {
      fieldType, subfragment: null
    };
  }
}

function getCollectionNameFromType(fieldType: string):string {
  if (fieldType.endsWith(" | null"))
    return getCollectionNameFromType(fieldType.substr(0, fieldType.length - 7))
  if (fieldType.startsWith("Array<"))
    return getCollectionNameFromType(fieldType.substr(6, fieldType.length - 7));
  else
    return getCollectionName(fieldType);
}

function getFragmentTypeFieldType(fieldType: string, subfragmentName: string) : string {
  if (fieldType.endsWith(' | null')) {
    return `${getFragmentTypeFieldType(fieldType.substring(0, fieldType.length - 7), subfragmentName)} | null`
  }
  // If it's an array type, then it's an array of that subfragment. Otherwise it's an instance of that subfragmetn.
  if (fieldType.startsWith("Array<")) {
    return `Array<${subfragmentName}>`
  } else {
    return subfragmentName
  }
}