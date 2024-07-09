import { IItem } from './TreeView/Types/Entity/IItem';

export function generateJsonFromIItem(item: IItem): any {
    if (item.isFile) {
        return item.label;
      }
    
      const result: any = {};
    
      if (item.children && item.children.length > 0) {
        const childrenResult: any = {};
    
        for (const child of item.children) {
          if (child.isFile) {
            if (!childrenResult[child.label]) {
              if (!result[item.label]) {
                result[item.label] = [];
              }
              result[item.label].push(child.label);
            }
          } else {
            if (!result[item.label]) {
              result[item.label] = [];
            }
            result[item.label].push(generateJsonFromIItem(child));
          }
        }
      }
    
      return result;
}