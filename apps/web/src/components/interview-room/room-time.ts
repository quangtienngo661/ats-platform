/** HH:mm in the viewer's time zone, as the room pages show times. */
export function formatRoomTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
}
