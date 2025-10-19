export const findComponentById = (components, id) => {
  if (!Array.isArray(components) || !id) {
    return null;
  }

  for (const component of components) {
    if (component?.id === id) {
      return component;
    }

    if (Array.isArray(component?.children) && component.children.length > 0) {
      const match = findComponentById(component.children, id);
      if (match) {
        return match;
      }
    }
  }

  return null;
};

export const removeComponentById = (components, id) => {
  if (!Array.isArray(components) || components.length === 0) {
    return components;
  }

  let hasChanges = false;

  const nextComponents = components.reduce((acc, component) => {
    if (component?.id === id) {
      hasChanges = true;
      return acc;
    }

    if (!Array.isArray(component?.children) || component.children.length === 0) {
      acc.push(component);
      return acc;
    }

    const updatedChildren = removeComponentById(component.children, id);
    if (updatedChildren !== component.children) {
      hasChanges = true;
      acc.push({ ...component, children: updatedChildren });
      return acc;
    }

    acc.push(component);
    return acc;
  }, []);

  return hasChanges ? nextComponents : components;
};

export const insertComponentIntoParent = (components, parentId, componentToInsert, insertIndex) => {
  if (!Array.isArray(components) || !parentId) {
    return components;
  }

  let hasChanges = false;

  const nextComponents = components.map((component) => {
    if (component?.id === parentId) {
      const currentChildren = Array.isArray(component.children) ? [...component.children] : [];
      const safeIndex = Math.min(Math.max(insertIndex, 0), currentChildren.length);
      currentChildren.splice(safeIndex, 0, componentToInsert);
      hasChanges = true;
      return { ...component, children: currentChildren };
    }

    if (Array.isArray(component?.children) && component.children.length > 0) {
      const updatedChildren = insertComponentIntoParent(component.children, parentId, componentToInsert, insertIndex);
      if (updatedChildren !== component.children) {
        hasChanges = true;
        return { ...component, children: updatedChildren };
      }
    }

    return component;
  });

  return hasChanges ? nextComponents : components;
};

export const isDescendant = (component, targetId) => {
  if (!component || !Array.isArray(component.children)) {
    return false;
  }

  return component.children.some((child) => {
    if (child.id === targetId) {
      return true;
    }

    return isDescendant(child, targetId);
  });
};

export const countComponents = (components = []) =>
  components.reduce((total, component) => {
    if (!component) {
      return total;
    }
    const childCount = Array.isArray(component.children) ? countComponents(component.children) : 0;
    return total + 1 + childCount;
  }, 0);
