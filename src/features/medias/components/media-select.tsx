import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMediaScope } from '../hooks/use-media-scope';

/**
 * 매체는 전역 조회 범위이므로 선택기는 화면이 아니라 헤더에 한 번만 둔다.
 * 목록은 로그인 운영자가 볼 수 있는 매체(`me`의 user_media)로 제한한다.
 */
export function MediaSelect() {
  const { mediaId, medias, setMediaId } = useMediaScope();
  if (medias.length === 0) return null;
  return (
    <Select
      value={mediaId === null ? undefined : String(mediaId)}
      onValueChange={(value) => setMediaId(Number(value))}
    >
      <SelectTrigger className="w-[150px]" aria-label="매체 선택">
        <SelectValue placeholder="매체" />
      </SelectTrigger>
      <SelectContent>
        {medias.map((media) => (
          <SelectItem key={media.id} value={String(media.id)}>
            {media.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
