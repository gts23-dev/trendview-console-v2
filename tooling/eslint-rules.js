import path from 'node:path';

function sourcePath(context) {
  return path
    .relative(path.join(context.cwd, 'src'), context.filename)
    .split(path.sep)
    .join('/');
}

const boundaries = {
  meta: { type: 'problem', schema: [], messages: { invalid: '{{reason}}' } },
  create(context) {
    const from = sourcePath(context);
    function check(node) {
      const source = node.source?.value;
      if (typeof source !== 'string') return;
      const to = source.startsWith('@/')
        ? source.slice(2)
        : source.startsWith('.')
          ? path.posix.normalize(
              path.posix.join(path.posix.dirname(from), source),
            )
          : null;
      const fromParts = from.split('/');
      const toParts = to?.split('/') ?? [];
      const fromLayer = fromParts[0];
      const toLayer = toParts[0];
      let reason;

      if (
        fromLayer === 'pages' &&
        (to?.startsWith('shared/api/') ||
          to?.startsWith('shared/query/') ||
          source === '@tanstack/react-query')
      ) {
        reason =
          '페이지에서는 HTTP client와 React Query를 직접 호출하지 말고 feature의 공개 API를 사용하세요.';
      }

      if (
        fromLayer === 'pages' &&
        toLayer === 'features' &&
        toParts.length > 2
      ) {
        reason =
          '페이지는 feature 내부 파일 대신 @/features/<feature> 공개 진입점을 사용하세요.';
      }

      if (
        fromLayer === 'pages' &&
        toLayer === 'pages' &&
        fromParts[1] !== toParts[1]
      ) {
        reason =
          '다른 페이지의 내부 파일을 참조하지 마세요. 재사용 코드는 책임에 맞는 feature 또는 components로 이동하세요.';
      }

      if (
        fromLayer === 'features' &&
        (toLayer === 'pages' || toLayer === 'routing')
      ) {
        reason = 'feature는 pages와 routing에 의존할 수 없습니다.';
      }

      if (
        fromLayer === 'features' &&
        toLayer === 'features' &&
        fromParts[1] !== toParts[1] &&
        toParts.length > 2
      ) {
        reason =
          '다른 feature는 @/features/<feature> 공개 진입점으로만 참조하세요.';
      }

      if (
        fromLayer === 'shared' &&
        ['components', 'config', 'features', 'pages', 'routing'].includes(
          toLayer,
        )
      ) {
        reason = 'shared는 업무 기능과 화면 계층에 의존할 수 없습니다.';
      }

      const isPureShared = fromLayer === 'shared' && fromParts[1] !== 'query';
      if (
        isPureShared &&
        /^(react($|\/)|react-dom($|\/)|react-router|react-hook-form|@tanstack\/react-query|sonner$)/.test(
          source,
        )
      ) {
        reason =
          'shared의 api, errors, logger, utils에는 React 상태와 UI 알림을 넣지 마세요.';
      }

      const isReusableComponent =
        from.startsWith('components/ui/') ||
        from.startsWith('components/common/');
      if (
        isReusableComponent &&
        ['features', 'pages', 'routing'].includes(toLayer)
      ) {
        reason =
          '기본 UI와 공통 조합 UI에는 특정 업무 기능이나 페이지 의존성을 넣지 마세요.';
      }

      const isLayout = from.startsWith('components/layouts/');
      if (
        isLayout &&
        ((toLayer === 'features' && toParts.length > 2) ||
          toLayer === 'pages' ||
          toLayer === 'routing')
      ) {
        reason =
          'layout은 feature의 공개 진입점만 사용할 수 있고 page와 routing에 의존할 수 없습니다.';
      }

      const isFeatureCore =
        fromLayer === 'features' && ['api', 'model'].includes(fromParts[2]);
      if (
        isFeatureCore &&
        (/^(react($|\/)|react-dom($|\/)|react-router|react-hook-form|@tanstack\/react-query|sonner$)/.test(
          source,
        ) ||
          toLayer === 'components')
      ) {
        reason =
          'feature의 api와 model에는 React 상태, 화면 부품, 토스트를 넣지 마세요.';
      }

      const crossesFolderBoundary =
        source.startsWith('.') &&
        (fromLayer !== toLayer ||
          (fromLayer === 'features' && fromParts[1] !== toParts[1]) ||
          (fromLayer === 'pages' && fromParts[1] !== toParts[1]));
      if (crossesFolderBoundary) {
        reason = '폴더 경계를 넘는 import는 @/ 별칭을 사용하세요.';
      }
      if (reason)
        context.report({ node, messageId: 'invalid', data: { reason } });
    }
    return {
      ImportDeclaration: check,
      ExportNamedDeclaration: check,
      ExportAllDeclaration: check,
      ImportExpression: check,
    };
  },
};

const fileName = {
  meta: {
    type: 'suggestion',
    schema: [],
    messages: {
      invalid:
        '파일과 폴더 이름은 kebab-case를 사용하세요. 예: entry-toolbar.tsx, menu.config.ts',
    },
  },
  create(context) {
    return {
      Program(node) {
        if (
          !sourcePath(context)
            .split('/')
            .every((part) => /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/.test(part))
        ) {
          context.report({ node, messageId: 'invalid' });
        }
      },
    };
  },
};

const errorToast = {
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      duplicate:
        '실패 알림은 shared/query/query-client.ts에서 처리합니다. 화면에서는 성공 알림만 작성하세요.',
    },
  },
  create(context) {
    const toastNames = new Set();
    return {
      ImportDeclaration(node) {
        if (node.source.value !== 'sonner') return;
        for (const item of node.specifiers) {
          if (item.type === 'ImportSpecifier' && item.imported.name === 'toast')
            toastNames.add(item.local.name);
        }
      },
      MemberExpression(node) {
        if (
          toastNames.has(node.object.name) &&
          (node.computed ? node.property.value : node.property.name) === 'error'
        ) {
          context.report({ node, messageId: 'duplicate' });
        }
      },
    };
  },
};

export const projectRules = {
  rules: { boundaries, 'file-name': fileName, 'error-toast': errorToast },
};
