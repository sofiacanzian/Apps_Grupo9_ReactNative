const axios = require('axios');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

const sendPushNotification = async ({ expoPushToken, title, body, data = {} }) => {
    if (!expoPushToken || !expoPushToken.startsWith('ExponentPushToken')) {
        console.warn('Token de push inválido, se omite el envío');
        return { skipped: true };
    }

    const headers = {
        'Content-Type': 'application/json',
    };

    if (process.env.EXPO_ACCESS_TOKEN) {
        headers.Authorization = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`;
    }

    try {
        const response = await axios.post(
            EXPO_PUSH_URL,
            {
                to: expoPushToken,
                sound: 'default',
                title,
                body,
                data,
            },
            { headers }
        );

        if (response.data?.data?.[0]?.status === 'error') {
            console.error('Expo push error:', response.data.data[0]);
        }

        return response.data;
    } catch (error) {
        console.error('Error enviando push notification:', error.response?.data || error.message);
        throw error;
    }
};

module.exports = { sendPushNotification };
