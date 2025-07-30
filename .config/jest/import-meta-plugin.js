module.exports = function({ types: t }) {
  return {
    name: 'transform-import-meta',
    visitor: {
      MetaProperty(path) {
        if (
          t.isIdentifier(path.node.meta, { name: 'import' }) &&
          t.isIdentifier(path.node.property, { name: 'meta' })
        ) {
          // Replace import.meta with a test object
          path.replaceWith(
            t.objectExpression([
              t.objectProperty(
                t.identifier('env'),
                t.memberExpression(t.identifier('process'), t.identifier('env'))
              ),
              t.objectProperty(
                t.identifier('url'),
                t.stringLiteral('file:///test-file.js')
              )
            ])
          );
        }
      },
      MemberExpression(path) {
        // Handle import.meta.env specifically
        if (
          t.isMetaProperty(path.node.object) &&
          t.isIdentifier(path.node.object.meta, { name: 'import' }) &&
          t.isIdentifier(path.node.object.property, { name: 'meta' }) &&
          t.isIdentifier(path.node.property, { name: 'env' })
        ) {
          path.replaceWith(
            t.memberExpression(t.identifier('process'), t.identifier('env'))
          );
        }
        // Handle import.meta.url specifically
        else if (
          t.isMetaProperty(path.node.object) &&
          t.isIdentifier(path.node.object.meta, { name: 'import' }) &&
          t.isIdentifier(path.node.object.property, { name: 'meta' }) &&
          t.isIdentifier(path.node.property, { name: 'url' })
        ) {
          path.replaceWith(t.stringLiteral('file:///test-file.js'));
        }
      }
    }
  };
};