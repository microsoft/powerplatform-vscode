import { IItem } from './TreeView/Types/Entity/IItem';

const componentTypeMap: { [key: string]: string } = {
    '08': 'web-temmplates',
    '07': 'content-snippets',
    '015': 'basic-forms',
    '017': 'lists',
    '019': 'advanced-forms'
};

export function generateJsonFromIItem(item: IItem): any {
    const result: any = {
        label: item.label
    };
   
    if (item.children && item.children.length > 0) {
        result.children = item.children.map(child => {
            const childResult = generateJsonFromIItem(child);
            if (item.label === 'References') {
                childResult['type'] = componentTypeMap[child.component];
            }
            return childResult;
        });
    }

    if (item.parentList && item.parentList.length > 0) {
        result.parentList = item.parentList.map(parent => ({
            type: parent.title,
            label: parent.label,
        }));
    }

    return result;
}