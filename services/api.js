import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Platform } from 'react-native';

export const TOKEN_STORAGE_KEY = 'token';
export const USER_STORAGE_KEY = 'auth_user';
export const LEGACY_USER_STORAGE_KEY = 'user';
export const HUB_STORAGE_KEY = 'teacher_hub';

const DEFAULT_API_BASE_URL = Platform.select({
  android: 'http://10.0.2.2:5000',
  ios: 'http://localhost:5000',
  default: 'http://localhost:5000',
});

export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL || '').replace(/\/+$/, '');

const buildErrorMessage = (payload, fallbackMessage) => {
  if (payload?.message) {
    return payload.message;
  }

  if (payload?.error) {
    return payload.error;
  }

  return fallbackMessage;
};

const buildDisplayName = (person) => {
  if (!person) {
    return '';
  }

  return (
    person.preferredName ||
    [person.firstName, person.lastName].filter(Boolean).join(' ').trim() ||
    person.username ||
    person.name ||
    person.email ||
    'Sparklass Member'
  );
};

export const normalizeMember = (member) => {
  if (!member) {
    return null;
  }

  return {
    ...member,
    _id: member._id || member.id || '',
    displayName: buildDisplayName(member),
  };
};

export const normalizeHub = (hub) => {
  if (!hub) {
    return null;
  }

  const ownerSource =
    hub.ownerProfile ||
    (hub.ownerId && typeof hub.ownerId === 'object' ? hub.ownerId : null) ||
    (hub.owner && typeof hub.owner === 'object' ? hub.owner : null) ||
    null;

  return {
    ...hub,
    _id: hub._id || hub.id || '',
    ownerId:
      typeof hub.ownerId === 'string'
        ? hub.ownerId
        : hub.ownerId?._id || hub.owner?._id || hub.ownerId || '',
    ownerProfile: ownerSource ? normalizeMember(ownerSource) : null,
    teachers: Array.isArray(hub.teachers) ? hub.teachers.map(normalizeMember).filter(Boolean) : [],
    admins: Array.isArray(hub.admins) ? hub.admins.map(normalizeMember).filter(Boolean) : [],
    primaryColor: hub.primaryColor || '#0f172a',
    secondaryColor: hub.secondaryColor || '#f59e0b',
  };
};

export const normalizeCourse = (course) => {
  if (!course) {
    return null;
  }

  return {
    ...course,
    _id: course._id || course.id || '',
    hubId: course.hubId || '',
    price: Number(course.price || 0),
    isFree: course.isFree ?? Number(course.price || 0) === 0,
    category: course.category || 'Uncategorized',
    level: course.level || 'beginner',
  };
};

export const normalizeModule = (moduleDoc) => {
  if (!moduleDoc) {
    return null;
  }

  return {
    ...moduleDoc,
    _id: moduleDoc._id || moduleDoc.id || '',
    courseId: moduleDoc.courseId || '',
    position: Number(moduleDoc.position || 0),
  };
};

export const normalizeVideo = (video) => {
  if (!video) {
    return null;
  }

  return {
    ...video,
    _id: video._id || video.id || '',
    videoType: video.videoType || 'course',
    order: Number(video.order || 0),
    duration: video.duration === undefined || video.duration === null ? null : Number(video.duration),
    videoUrl: video.videoUrl || '',
    hlsUrl: video.hlsUrl || '',
    url: video.url || video.hlsUrl || video.videoUrl || '',
    status: video.status || 'uploading',
  };
};

export const normalizeLesson = (lesson) => {
  if (!lesson) {
    return null;
  }

  const normalizedVideo =
    lesson.video && typeof lesson.video === 'object'
      ? normalizeVideo(lesson.video)
      : lesson.videoId && typeof lesson.videoId === 'object'
        ? normalizeVideo(lesson.videoId)
        : null;

  const resolvedVideoId =
    typeof lesson.videoId === 'string'
      ? lesson.videoId
      : lesson.videoId?._id || normalizedVideo?._id || '';

  const legacyVideoUrl = lesson.videoUrl || '';
  const resolvedDuration =
    lesson.duration === undefined || lesson.duration === null
      ? normalizedVideo?.duration ?? null
      : Number(lesson.duration);

  return {
    ...lesson,
    _id: lesson._id || lesson.id || '',
    moduleId: lesson.moduleId || '',
    courseId: lesson.courseId || '',
    title: lesson.title || normalizedVideo?.title || '',
    videoId: resolvedVideoId,
    video: normalizedVideo,
    videoUrl: legacyVideoUrl,
    hlsUrl: normalizedVideo?.hlsUrl || lesson.hlsUrl || '',
    duration: resolvedDuration,
    position: Number(lesson.position || 0),
    isPreview: Boolean(lesson.isPreview),
    videoStatus: normalizedVideo?.status || lesson.videoStatus || '',
    hasAttachedVideo: Boolean(resolvedVideoId || normalizedVideo?.url || legacyVideoUrl),
  };
};

let authToken = '';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  const requestConfig = { ...config };
  const resolvedToken =
    authToken || (await AsyncStorage.getItem(TOKEN_STORAGE_KEY).catch(() => null)) || '';

  requestConfig.headers = {
    ...(requestConfig.headers || {}),
  };

  if (resolvedToken && !requestConfig.headers.Authorization) {
    requestConfig.headers.Authorization = `Bearer ${resolvedToken}`;
  }

  const method = String(requestConfig.method || 'GET').toUpperCase();
  const targetUrl = requestConfig.url?.startsWith('http')
    ? requestConfig.url
    : `${requestConfig.baseURL || ''}${requestConfig.url || ''}`;

  console.log('API CALL:', `${method} ${targetUrl}`);
  if (requestConfig.params !== undefined || requestConfig.data !== undefined) {
    console.log('REQUEST:', {
      params: requestConfig.params,
      body: requestConfig.data,
    });
  }

  return requestConfig;
});

apiClient.interceptors.response.use(
  (response) => {
    console.log('RESPONSE:', {
      status: response.status,
      url: response.config?.url,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.log('API ERROR:', error?.response || error);
    return Promise.reject(error);
  }
);

export const setAuthToken = (token) => {
  authToken = token || '';

  if (authToken) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${authToken}`;
    return;
  }

  delete apiClient.defaults.headers.common.Authorization;
};

export const request = async (
  endpoint,
  { method = 'GET', body, headers = {}, params, signal, validateStatus } = {},
  fallbackMessage = 'Request failed.'
) => {
  try {
    const response = await apiClient.request({
      url: endpoint,
      method,
      data: body,
      headers,
      params,
      signal,
      validateStatus,
    });

    if (response.status >= 400) {
      throw new Error(buildErrorMessage(response.data, fallbackMessage));
    }

    return response.data ?? null;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        throw new Error(buildErrorMessage(error.response.data, fallbackMessage));
      }

      throw new Error('Unable to reach the hub services right now.');
    }

    throw error instanceof Error ? error : new Error(fallbackMessage);
  }
};

// AUTH
export const login = async ({ email, password }) => {
  const authPayload = await request(
    '/auth/login',
    {
      method: 'POST',
      body: { email, password },
    },
    'Unable to sign in right now.'
  );

  if (!authPayload?.token || !authPayload?.user) {
    throw new Error('Invalid authentication response from server.');
  }

  return {
    ...authPayload,
    role: authPayload?.role || authPayload?.user?.role || '',
    user: {
      ...authPayload.user,
      role: authPayload?.user?.role || authPayload?.role || '',
    },
  };
};

export const register = async ({ name, email, password }) => {
  const authPayload = await request(
    '/auth/register',
    {
      method: 'POST',
      body: { name, email, password },
    },
    'Unable to create your account right now.'
  );

  if (!authPayload?.token || !authPayload?.user) {
    throw new Error('Invalid authentication response from server.');
  }

  return {
    ...authPayload,
    role: authPayload?.role || authPayload?.user?.role || '',
    user: {
      ...authPayload.user,
      role: authPayload?.user?.role || authPayload?.role || '',
    },
  };
};

export const becomeTeacher = () =>
  request('/auth/become-teacher', { method: 'PATCH' }, 'Failed to upgrade your account.');

// PUBLIC COURSES
export const getCourses = (signal) =>
  request('/courses', { signal }, 'Failed to load courses.').then((data) =>
    (Array.isArray(data) ? data : Array.isArray(data?.courses) ? data.courses : [])
      .map(normalizeCourse)
      .filter(Boolean)
  );

export const fetchPublicCourseBySlug = (slug, signal) =>
  request(`/courses/${slug}`, { signal }, 'Failed to load course details.').then(normalizeCourse);

export const getCourse = fetchPublicCourseBySlug;

export const enroll = async (courseId) => {
  try {
    const response = await apiClient.post(`/enroll/${courseId}`, undefined, {
      validateStatus: (status) => (status >= 200 && status < 300) || status === 409,
    });

    return {
      ...(response.data || {}),
      alreadyEnrolled: response.status === 409,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error('Login required to enroll in this course.');
      }

      throw new Error(buildErrorMessage(error.response?.data, 'Unable to enroll right now.'));
    }

    throw error instanceof Error ? error : new Error('Unable to enroll right now.');
  }
};

// HUB
export const fetchMyHub = (signal) =>
  request('/hub/me', { signal }, 'Failed to load your teacher hub.').then((payload) =>
    normalizeHub(payload?.hub || payload)
  );

export const getMyHub = fetchMyHub;

export const fetchMyWorkingHubs = (signal) =>
  request('/my', { signal }, 'Failed to load your hubs.').then((data) =>
    (Array.isArray(data) ? data : []).map(normalizeHub).filter(Boolean)
  );

export const fetchManagedHubBySlug = (slug, signal) =>
  request(`/hub/${slug}/manage`, { signal }, 'Failed to load this hub workspace.').then((payload) => ({
    hub: normalizeHub(payload?.hub || payload),
    role: payload?.role || 'teacher',
  }));

export const fetchPublicHub = (slug, signal) =>
  request(`/hub/${slug}`, { signal }, 'Failed to load this hub.').then(normalizeHub);

export const getPublicHub = fetchPublicHub;

export const fetchHubTeam = (hubId, signal) =>
  request(`/hub/${hubId}/team`, { signal }, 'Failed to load hub team.').then((payload) => ({
    owner: normalizeMember(payload?.owner),
    teachers: Array.isArray(payload?.teachers)
      ? payload.teachers.map(normalizeMember).filter(Boolean)
      : [],
    admins: Array.isArray(payload?.admins) ? payload.admins.map(normalizeMember).filter(Boolean) : [],
  }));

export const addHubTeacher = (hubId, payload) =>
  request(`/hub/${hubId}/add-teacher`, { method: 'POST', body: payload }, 'Failed to add teacher.');

export const addHubAdmin = (hubId, payload) =>
  request(`/hub/${hubId}/add-admin`, { method: 'POST', body: payload }, 'Failed to add admin.');

export const updateHubSettings = (hubId, payload) =>
  request(`/hub/${hubId}/settings`, { method: 'PATCH', body: payload }, 'Failed to update hub settings.').then(
    (response) => ({
      ...response,
      hub: normalizeHub(response?.hub),
    })
  );

export const fetchHubActivity = (hubId, signal) =>
  request(`/hub/${hubId}/activity`, { signal }, 'Failed to load hub activity.').then((data) =>
    (Array.isArray(data) ? data : []).map((activity) => ({
      ...activity,
      userId: normalizeMember(activity.userId),
    }))
  );

// COURSES
export const fetchPublicHubCourses = (hubId, signal) =>
  request(`/courses/hub/${hubId}`, { signal }, 'Failed to load public hub courses.').then((data) =>
    (Array.isArray(data) ? data : []).map(normalizeCourse).filter(Boolean)
  );

export const fetchManagedHubCourses = (hubId, signal) =>
  request(`/courses/hub/${hubId}/manage`, { signal }, 'Failed to load hub courses.').then((data) =>
    (Array.isArray(data) ? data : []).map(normalizeCourse).filter(Boolean)
  );

export const getHubCourses = fetchManagedHubCourses;

export const fetchManagedCourseById = (courseId, signal) =>
  request(`/courses/id/${courseId}/manage`, { signal }, 'Failed to load course details.').then(normalizeCourse);

export const createCourse = (payload) =>
  request('/courses', { method: 'POST', body: payload }, 'Failed to create course.').then(normalizeCourse);

export const updateCourse = (courseId, payload) =>
  request(`/courses/${courseId}`, { method: 'PATCH', body: payload }, 'Failed to update course.').then(
    normalizeCourse
  );

export const publishCourse = (courseId) =>
  request(`/courses/${courseId}/publish`, { method: 'PATCH' }, 'Failed to publish course.').then(
    normalizeCourse
  );

export const archiveCourse = (courseId) =>
  request(`/courses/${courseId}/archive`, { method: 'PATCH' }, 'Failed to archive course.').then(
    normalizeCourse
  );

// MODULES / LESSONS
export const fetchModulesByCourse = (courseId, signal) =>
  request(`/modules/course/${courseId}`, { signal }, 'Failed to load course modules.').then((data) =>
    (Array.isArray(data) ? data.map(normalizeModule).filter(Boolean) : [])
  );

export const getModulesByCourse = fetchModulesByCourse;

export const fetchLessonsByModule = (moduleId, signal) =>
  request(`/lessons/module/${moduleId}`, { signal }, 'Failed to load module lessons.').then((data) =>
    (Array.isArray(data) ? data.map(normalizeLesson).filter(Boolean) : [])
  );

export const getLessonsByModule = fetchLessonsByModule;

export const createModule = (payload) =>
  request('/modules', { method: 'POST', body: payload }, 'Failed to create module.').then(normalizeModule);

export const createLesson = (payload) =>
  request('/lessons', { method: 'POST', body: payload }, 'Failed to create lesson.').then(normalizeLesson);

export const attachLessonVideo = (lessonId, videoId) =>
  request(
    `/lessons/${lessonId}/attach-video`,
    { method: 'PATCH', body: { videoId } },
    'Failed to attach video to lesson.'
  ).then(normalizeLesson);

// VIDEOS
export const fetchManagedCourseVideos = (courseId, signal) =>
  request(`/videos/course/${courseId}/manage`, { signal }, 'Failed to load course videos.').then((data) =>
    (Array.isArray(data) ? data : []).map(normalizeVideo).filter(Boolean)
  );

export const fetchManagedHubVideos = (hubId, signal) =>
  request(`/videos/hub/${hubId}/manage`, { signal }, 'Failed to load hub videos.').then((data) =>
    (Array.isArray(data) ? data : []).map(normalizeVideo).filter(Boolean)
  );

export const fetchPublicHubStandaloneVideos = (hubId, signal) =>
  request(`/videos/hub/${hubId}/standalone`, { signal }, 'Failed to load hub updates.').then((data) =>
    (Array.isArray(data) ? data : []).map(normalizeVideo).filter(Boolean)
  );

export const getVideos = (courseId, signal) =>
  request(`/videos/course/${courseId}/playback`, { signal }, 'Failed to load course videos.').then((data) =>
    (Array.isArray(data) ? data : Array.isArray(data?.videos) ? data.videos : [])
      .map(normalizeVideo)
      .filter(Boolean)
      .sort((first, second) => first.order - second.order)
  );

export const getVideoFileType = (file) => {
  const fileName = file?.name || '';
  const extension = fileName.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '');

  if (extension) {
    return extension;
  }

  return file?.mimeType?.split('/')[1]?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'mp4';
};

export const requestVideoUploadUrl = (payload) =>
  request('/videos/upload-url', { method: 'POST', body: payload }, 'Failed to prepare the video upload.');

export const uploadVideoFile = async (uploadUrl, fileBody, mimeTypeOrExtension) => {
  const contentType = String(mimeTypeOrExtension || '').includes('/')
    ? mimeTypeOrExtension
    : `video/${mimeTypeOrExtension || 'mp4'}`;

  console.log('API CALL:', `PUT ${uploadUrl}`);
  console.log('REQUEST:', { contentType });

  try {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
      },
      body: fileBody,
    });

    if (!response.ok) {
      throw new Error(`Upload failed with status ${response.status}.`);
    }

    console.log('RESPONSE:', {
      status: response.status,
      url: uploadUrl,
    });
  } catch (error) {
    console.log('API ERROR:', error);

    if (error instanceof TypeError) {
      throw new Error('Unable to upload the video file right now.');
    }

    throw error instanceof Error ? error : new Error('Unable to upload the video file right now.');
  }
};

export const createVideo = (payload) =>
  request('/videos', { method: 'POST', body: payload }, 'Failed to save the uploaded video.').then(
    normalizeVideo
  );

export const processVideo = (videoId) =>
  request(`/videos/${videoId}/process`, { method: 'POST' }, 'Failed to start video processing.');

export { apiClient };

export default apiClient;
