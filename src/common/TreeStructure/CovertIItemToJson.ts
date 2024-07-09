
import { IItem } from './TreeView/Types/Entity/IItem';

export function generateJsonFromIItem(item: IItem): any {
    const generateGUID = (): string => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };
    console.log(item);
    const result: any = {
        type: item.title,
        label: item.label,
        GUID: generateGUID(), 
        children: [],
        parentList: item.parentList.map(parent => ({
            type: parent.title,
            label: parent.label,
            GUID: generateGUID(),
        }))
    };
    
    if (item.children && item.children.length > 0) {
      result.children=item.children.map(child => generateJsonFromIItem(child));
    }

    return result;
}