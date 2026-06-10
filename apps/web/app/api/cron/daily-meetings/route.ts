import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Use service role key to bypass RLS when inserting notifications
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    // Optional cron secret check to secure the endpoint
    const authHeader = request.headers.get('authorization');
    if (
      process.env.CRON_SECRET && 
      authHeader !== `Bearer ${process.env.CRON_SECRET}` &&
      request.headers.get('x-cron-secret') !== process.env.CRON_SECRET
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch today's meetings
    const { data: meetings, error: meetingsError } = await supabase
      .from('meetings')
      .select('id, title, start_time, departments, created_by')
      .gte('start_time', startOfDay.toISOString())
      .lte('start_time', endOfDay.toISOString());

    if (meetingsError) throw meetingsError;
    if (!meetings || meetings.length === 0) {
      return NextResponse.json({ message: 'Không có cuộc họp nào trong ngày hôm nay.' });
    }

    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, department');

    if (usersError) throw usersError;

    const notificationsToInsert: any[] = [];

    // For each meeting, determine who should be notified
    for (const meeting of meetings) {
      const isAllDepts = !meeting.departments || meeting.departments.length === 0 || meeting.departments.includes('Tất cả');

      for (const user of (users || [])) {
        // Trừ người tạo
        if (user.id === meeting.created_by) continue;

        let shouldNotify = false;
        if (isAllDepts) {
          shouldNotify = true;
        } else if (user.department && meeting.departments.includes(user.department)) {
          shouldNotify = true;
        }

        if (shouldNotify) {
          notificationsToInsert.push({
            user_id: user.id,
            title: 'Lịch họp hôm nay',
            message: `[Lịch họp] Hôm nay có cuộc họp: ${meeting.title}`,
            document_id: meeting.id,
            is_read: false,
          });
        }
      }
    }

    if (notificationsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('notifications')
        .insert(notificationsToInsert);

      if (insertError) throw insertError;
    }

    return NextResponse.json({ 
      success: true, 
      message: `Đã gửi ${notificationsToInsert.length} thông báo cho các cuộc họp trong ngày.` 
    });
  } catch (error: any) {
    console.error('Error sending daily meeting notifications:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
