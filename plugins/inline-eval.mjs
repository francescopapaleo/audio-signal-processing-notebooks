function inlineEvalBrowser() {
  'use strict';

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    // Running in a non-browser environment (e.g., during SSG build)
    return;
  }

  // Store variables from code cells
  const variables = {};

  /**
   * Extract variable values from code cell outputs
   * Looks for JSON script tags with variable data
   */
  function extractVariables() {
    // Find all JSON script tags with variable data
    const jsonScripts = document.querySelectorAll(
      'script[type="application/json"][id^="wave-params"], script[type="application/json"][id^="var-data"]',
    );

    jsonScripts.forEach((script) => {
      try {
        const data = JSON.parse(script.textContent);
        Object.assign(variables, data);
      } catch (e) {
        console.warn('Could not parse variable data:', e);
      }
    });

    // Also look for data attributes (fallback)
    const codeCells = document.querySelectorAll('.cell_output, .jp-OutputArea-output');
    codeCells.forEach((cell) => {
      const dataAttrs = cell.querySelectorAll('[data-var]');
      dataAttrs.forEach((attr) => {
        const varName = attr.getAttribute('data-var');
        const varValue = attr.getAttribute('data-value');
        if (varName && varValue !== null) {
          try {
            variables[varName] = JSON.parse(varValue);
          } catch (e) {
            variables[varName] = varValue;
          }
        }
      });
    });
  }

  /**
   * Evaluate a simple Python-like expression
   * Supports basic arithmetic and variable references
   */
  function evaluateExpression(expr) {
    // Remove backticks if present
    expr = expr.replace(/`/g, '').trim();

    // Try to evaluate as a variable first
    if (Object.prototype.hasOwnProperty.call(variables, expr)) {
      return variables[expr];
    }

    // Try to evaluate as a function call (e.g., round(T, 6))
    const funcMatch = expr.match(/^(\w+)\((.*)\)$/);
    if (funcMatch) {
      const funcName = funcMatch[1];
      const args = funcMatch[2].split(',').map((a) => a.trim());

      if (funcName === 'round') {
        const value = variables[args[0]] ?? parseFloat(args[0]);
        const decimals = parseInt(args[1], 10) || 0;
        if (Number.isFinite(value)) {
          return parseFloat(Number(value).toFixed(decimals));
        }
      }
    }

    // Try simple arithmetic
    try {
      // Replace variable names with their values
      let evalExpr = expr;
      for (const [key, value] of Object.entries(variables)) {
        evalExpr = evalExpr.replace(new RegExp(`\\b${key}\\b`, 'g'), value);
      }
      // Evaluate safely (only numbers and basic operators)
      if (/^[0-9+\-*/().\s]+$/.test(evalExpr)) {
        return eval(evalExpr); // eslint-disable-line no-eval
      }
    } catch (e) {
      console.warn('Could not evaluate expression:', expr, e);
    }

    return expr; // Return original if can't evaluate
  }

  /**
   * Process all inline expressions in the page
   */
  function processInlineExpressions() {
    // Find all elements with data-eval attribute
    const evalElements = document.querySelectorAll('[data-eval]');

    evalElements.forEach((elem) => {
      const expr = elem.getAttribute('data-eval');
      const result = evaluateExpression(expr);
      elem.textContent = result;
    });

    // Also process {eval}`...` syntax in markdown
    const markdownContent = document.querySelectorAll('.myst-content, .content');
    markdownContent.forEach((container) => {
      const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);

      const textNodes = [];
      let node;
      // eslint-disable-next-line no-cond-assign
      while ((node = walker.nextNode())) {
        if (node.textContent.includes('{eval}')) {
          textNodes.push(node);
        }
      }

      textNodes.forEach((textNode) => {
        const parent = textNode.parentElement;
        const text = textNode.textContent;
        const regex = /\{eval\}`([^`]+)`/g;
        let match;
        let lastIndex = 0;
        const fragment = document.createDocumentFragment();

        // eslint-disable-next-line no-cond-assign
        while ((match = regex.exec(text)) !== null) {
          // Add text before the match
          if (match.index > lastIndex) {
            fragment.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));
          }

          // Evaluate and add result
          const expr = match[1];
          const result = evaluateExpression(expr);
          const span = document.createElement('span');
          span.textContent = result;
          fragment.appendChild(span);

          lastIndex = regex.lastIndex;
        }

        // Add remaining text
        if (lastIndex < text.length) {
          fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
        }

        // Replace the text node if we found matches
        if (fragment.childNodes.length > 0) {
          parent.replaceChild(fragment, textNode);
        }
      });
    });
  }

  /**
   * Initialize when DOM is ready
   */
  function init() {
    // Extract variables from code cells
    extractVariables();

    // Process inline expressions
    processInlineExpressions();

    // Also listen for dynamically loaded content
    const observer = new MutationObserver(() => {
      extractVariables();
      processInlineExpressions();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}

const inlineEvalScript = `(${inlineEvalBrowser.toString()})();`;

const inlineEvalTransform = {
  name: 'inline-eval-script',
  stage: 'document',
  plugin: () => (tree) => {
    const hasScript = tree.children?.some(
      (child) =>
        child?.data?.hName === 'script' &&
        child?.data?.hProperties?.id === 'inline-eval-script',
    );

    if (hasScript) {
      return;
    }

    tree.children = tree.children ?? [];
    tree.children.push({
      type: 'inlineEvalScript',
      data: {
        hName: 'script',
        hProperties: {
          id: 'inline-eval-script',
          type: 'text/javascript',
        },
        hChildren: [{ type: 'text', value: inlineEvalScript }],
      },
    });
  },
};

const plugin = {
  name: 'Inline Evaluator',
  directives: [],
  roles: [],
  transforms: [inlineEvalTransform],
};

export default plugin;
