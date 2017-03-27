import { Util } from './Util';

export default class ControlRecordTreeMgr {

  generateNextTree(rootTree, formFieldPath) {
    let updatedTree = this.getBrotherTree(rootTree, formFieldPath);
    if (updatedTree.children && updatedTree.children.size > 0) {
      const filteredTree = this.filterChildTree(updatedTree);
      const clonedChildTree = filteredTree.map(r => (
                this.generateNextTree(rootTree, r.formFieldPath)
            ));
      updatedTree = updatedTree.set('children', clonedChildTree);
    }
    const nextFormFieldPath = this.generateFormFieldPath(updatedTree);
    return updatedTree.set('formFieldPath', nextFormFieldPath).set('value', {}).set('active', true);
  }

  filterChildTree(updatedTree) {
    const getPrefix = (formFieldPath) => (formFieldPath.split('-')[0]);

    return updatedTree.children.groupBy(r => getPrefix(r.formFieldPath))
                      .map(x => x.first()).toList();
  }

  generateFormFieldPath(maxSuffixTree) {
    const nextSuffix = Util.increment(maxSuffixTree.formFieldPath.split('-')[1]);
    return `${maxSuffixTree.formFieldPath.split('-')[0]}-${nextSuffix}`;
  }

  findParentTree(parentTree, formFieldPath) {
    let targetTree = undefined;
    parentTree.children.forEach(childTree => {
      if (childTree.formFieldPath === formFieldPath) {
        targetTree = parentTree;
      } else if (!targetTree && childTree.children) {
        const foundTree = this.findParentTree(childTree, formFieldPath);
        if (foundTree) {
          targetTree = foundTree;
        }
      }
    });

    return targetTree;
  }

  addToRootTree(rootTree, parentTree, addedTree) {
    if (rootTree === parentTree) {
      return rootTree.set('children', rootTree.children.push(addedTree));
    }

    const tree = rootTree.children.map(childTree => {
      if (childTree.children) {
        const updatedChildTree = this.addToRootTree(childTree, parentTree, addedTree);
        return updatedChildTree || childTree;
      }
      return childTree;
    });

    return rootTree.set('children', tree);
  }

  getBrotherTree(parentTree, targetFormFieldPath) {
    const getPrefix = (formFieldPath) => (formFieldPath.split('-')[0]);
    const getSuffix = (record) => (Util.toInt(record.formFieldPath.split('-')[1]));

    const isLatestBrotherTree = (originalRecord, newRecord) => (
            (getPrefix(targetFormFieldPath) === getPrefix(newRecord.formFieldPath)) &&
            (!originalRecord || (getSuffix(originalRecord) < getSuffix(newRecord)))
        );

    let latestSimilarTree = undefined;

    parentTree.children.forEach(childTree => {
      if (isLatestBrotherTree(latestSimilarTree, childTree)) {
        latestSimilarTree = childTree;
      }
      if (childTree.children) {
        const foundSimilarRecord = this.getBrotherTree(childTree, targetFormFieldPath);
        if (foundSimilarRecord && isLatestBrotherTree(latestSimilarTree, foundSimilarRecord)) {
          latestSimilarTree = foundSimilarRecord;
        }
      }
    });
    return latestSimilarTree;
  }

  static add(rootTree, formFieldPath) {
    const treeMgr = new ControlRecordTreeMgr();
    const parentTree = treeMgr.findParentTree(rootTree, formFieldPath);
    const addedTree = treeMgr.generateNextTree(rootTree, formFieldPath);
    return treeMgr.addToRootTree(rootTree, parentTree, addedTree);
  }

  static update(rootTree, nodeTree) {
    if (rootTree.formFieldPath === nodeTree.formFieldPath) {
      return nodeTree;
    }

    if (rootTree.children) {
      const updatedChild = rootTree.children.map(r => (
        ControlRecordTreeMgr.update(r, nodeTree) || r
      ));
      return rootTree.set('children', updatedChild);
    }

    return null;
  }

  static find(rootTree, formFieldPath) {
    const parentTree = new ControlRecordTreeMgr().findParentTree(rootTree, formFieldPath);
    if (parentTree) {
      const filteredList = parentTree.children.filter(r => r.formFieldPath === formFieldPath);
      return filteredList.get(0);
    }
    return null;
  }
}
