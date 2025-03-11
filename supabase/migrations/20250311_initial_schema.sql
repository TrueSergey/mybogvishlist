-- Создание таблицы пользователей (расширяет встроенную таблицу auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы желаний
CREATE TABLE IF NOT EXISTS public.wishes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    link TEXT,
    image_url TEXT,
    is_fulfilled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы для дружбы между пользователями
CREATE TABLE IF NOT EXISTS public.friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, rejected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Уникальное ограничение для пары пользователей
    CONSTRAINT unique_friendship UNIQUE(user_id, friend_id),
    -- Проверка, что пользователь не может дружить сам с собой
    CONSTRAINT no_self_friendship CHECK(user_id != friend_id)
);

-- Создание таблицы для уведомлений
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL, -- friend_request, wish_fulfilled и т.д.
    content JSONB NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание необходимых индексов
CREATE INDEX IF NOT EXISTS wishes_user_id_idx ON public.wishes(user_id);
CREATE INDEX IF NOT EXISTS friendships_user_id_idx ON public.friendships(user_id);
CREATE INDEX IF NOT EXISTS friendships_friend_id_idx ON public.friendships(friend_id);
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON public.notifications(is_read);

-- Настройка RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Политики безопасности для профилей
CREATE POLICY "Users can view any profile" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (id = auth.uid());

-- Политики безопасности для желаний
CREATE POLICY "Users can view their own wishes" 
ON public.wishes FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Users can view their friends' wishes" 
ON public.wishes FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.friendships 
        WHERE 
            (friendships.user_id = auth.uid() AND friendships.friend_id = wishes.user_id) OR
            (friendships.friend_id = auth.uid() AND friendships.user_id = wishes.user_id)
        AND friendships.status = 'accepted'
    )
);

CREATE POLICY "Users can create their own wishes" 
ON public.wishes FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own wishes" 
ON public.wishes FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own wishes" 
ON public.wishes FOR DELETE 
TO authenticated 
USING (user_id = auth.uid());

-- Политики безопасности для дружбы
CREATE POLICY "Users can view their own friendships" 
ON public.friendships FOR SELECT 
TO authenticated 
USING (user_id = auth.uid() OR friend_id = auth.uid());

CREATE POLICY "Users can create friendships" 
ON public.friendships FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own friendship status" 
ON public.friendships FOR UPDATE 
TO authenticated 
USING (friend_id = auth.uid());

-- Политики безопасности для уведомлений
CREATE POLICY "Users can view their own notifications" 
ON public.notifications FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" 
ON public.notifications FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid());