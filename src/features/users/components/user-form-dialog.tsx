import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

// 비밀번호 길이, 이메일 중복 같은 서버 규칙은 알 수 없어 넣지 않는다. 서버가
// 거절하면 공통 실패 알림이 뜬다. 이메일은 로그인 아이디이고 이메일 형식이
// 아닌 계정도 있어 형식을 검사하지 않는다. 기존 콘솔도 검사하지 않았다.
const schema = z
  .object({
    email: z.string().trim().min(1, '이메일을 입력해 주세요.'),
    name: z.string().trim().min(1, '이름을 입력해 주세요.'),
    password: z.string().min(1, '비밀번호를 입력해 주세요.'),
    passwordConfirmation: z.string(),
  })
  .refine((values) => values.password === values.passwordConfirmation, {
    message: '비밀번호가 일치하지 않습니다.',
    path: ['passwordConfirmation'],
  });

export type UserFormValues = z.infer<typeof schema>;

// 남의 계정을 만드는 폼이다. 로그인한 관리자의 저장된 값이 채워지지 않게 한다.
const FIELDS = [
  { name: 'email', label: '이메일', type: 'text', autoComplete: 'off' },
  { name: 'name', label: '이름', type: 'text', autoComplete: 'off' },
  {
    name: 'password',
    label: '비밀번호',
    type: 'password',
    autoComplete: 'new-password',
  },
  {
    name: 'passwordConfirmation',
    label: '비밀번호 확인',
    type: 'password',
    autoComplete: 'new-password',
  },
] as const;

interface UserFormDialogProps {
  open: boolean;
  /** 새 사용자가 속할 매체. 헤더에서 고른 매체다. */
  mediaName: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: UserFormValues) => void;
  pending: boolean;
}

export function UserFormDialog({
  open,
  mediaName,
  onOpenChange,
  onSubmit,
  pending,
}: UserFormDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!pending) onOpenChange(value);
      }}
    >
      <DialogContent className="sm:max-w-md">
        {/* 닫으면 폼이 사라져 입력한 비밀번호가 남지 않는다. */}
        <UserForm
          mediaName={mediaName}
          onCancel={() => onOpenChange(false)}
          onSubmit={onSubmit}
          pending={pending}
        />
      </DialogContent>
    </Dialog>
  );
}

interface UserFormProps {
  mediaName: string;
  onCancel: () => void;
  onSubmit: (values: UserFormValues) => void;
  pending: boolean;
}

function UserForm({ mediaName, onCancel, onSubmit, pending }: UserFormProps) {
  const form = useForm<UserFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      name: '',
      password: '',
      passwordConfirmation: '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <DialogHeader>
          <DialogTitle>사용자 등록</DialogTitle>
          <DialogDescription>
            {mediaName}에 새 사용자를 등록합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-4">
          {FIELDS.map(({ name, label, type, autoComplete }) => (
            <FormField
              key={name}
              control={form.control}
              name={name}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{label}</FormLabel>
                  <FormControl>
                    <Input
                      type={type}
                      autoComplete={autoComplete}
                      {...field}
                      disabled={pending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={onCancel}
          >
            취소
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? '등록 중...' : '등록'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
