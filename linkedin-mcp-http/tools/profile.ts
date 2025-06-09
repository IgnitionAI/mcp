import { getAccessToken } from './auth';

export async function getProfile() {
    const accessToken = getAccessToken();
    if (!accessToken) {
        return {
            success: false,
            message: 'Non authentifié. Veuillez vous connecter d\'abord.',
        };
    }

    try {
        const response = await fetch('https://api.linkedin.com/v2/userinfo', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'X-Restli-Protocol-Version': '2.0.0',
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            const responseText = await response.text();

            console.error(`LinkedIn API error response: ${response.status}\n${responseText}`);
            try {
                const errorData = JSON.parse(responseText);

                throw new Error(`LinkedIn API error: ${response.status} ${JSON.stringify(errorData)}`);
            } catch (parseError) {
                throw new Error(`LinkedIn API error: ${response.status}\nResponse: ${responseText.substring(0, 100)}...`);
            }
        }

        const profile = await response.json();
        let profilePictureData = null;

        try {
            const pictureResponse = await fetch('https://api.linkedin.com/v2/userinfo?projection=(id,profilePicture(displayImage~:playableStreams))', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'X-Restli-Protocol-Version': '2.0.0',
                    'Content-Type': 'application/json',
                },
            });
            if (pictureResponse.ok) {
                const pictureData = await pictureResponse.json();
                profilePictureData = pictureData.profilePicture;
            }
        } catch (pictureError) {
            console.error('Erreur lors de la récupération de l\'image de profil:', pictureError);
        }

        if (profilePictureData) {
            profile.profilePicture = profilePictureData;
        }

        return {
            success: true,
            profile,
        };
    } catch (error) {
        console.error('Erreur lors de la récupération du profil LinkedIn:', error);

        return {
            success: false,
            message: 'Échec de la récupération du profil',
            error: String(error),
        };
    }
}


export async function getEmail() {
    const accessToken = getAccessToken();
    if (!accessToken) {
        return {
            success: false,
            message: 'Non authentifié. Veuillez vous connecter d\'abord.',
        };
    }

    try {
        const response = await fetch('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'X-Restli-Protocol-Version': '2.0.0',
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            const responseText = await response.text();

            console.error(`LinkedIn API error response: ${response.status}\n${responseText}`);
            try {
                const errorData = JSON.parse(responseText);

                throw new Error(`LinkedIn API error: ${response.status} ${JSON.stringify(errorData)}`);
            } catch (parseError) {
                throw new Error(`LinkedIn API error: ${response.status}\nResponse: ${responseText.substring(0, 100)}...`);
            }
        }

        const emailResponse = await response.json();

        return {
            success: true,
            email: emailResponse.elements[0]['handle~'].emailAddress
        };
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'email LinkedIn:', error);

        return {
            success: false,
            message: 'Échec de la récupération de l\'email',
            error: String(error),
        };
    }
}

export async function updateHeadline(headline: string) {
    const accessToken = getAccessToken();
    if (!accessToken) {
        return {
            success: false,
            message: 'Non authentifié. Veuillez vous connecter d\'abord.',
        };
    }

    try {
        const apiUrl = 'https://api.linkedin.com/v2/me';
        const patchData = {
            patch: {
                $set: {
                    headline: headline
                }
            }
        };
        const response = await fetch(apiUrl, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'X-Restli-Protocol-Version': '2.0.0'
            },
            body: JSON.stringify(patchData)
        });
        if (!response.ok) {
            const responseText = await response.text();

            console.error(`LinkedIn API error response: ${response.status}\n${responseText}`);
            try {
                const errorData = JSON.parse(responseText);

                throw new Error(`LinkedIn API error: ${response.status} ${JSON.stringify(errorData)}`);
            } catch (parseError) {
                throw new Error(`LinkedIn API error: ${response.status}\nResponse: ${responseText.substring(0, 100)}...`);
            }
        }

        return {
            success: true,
            message: `Titre professionnel mis à jour avec succès: "${headline}"`,
        };
    } catch (error) {
        console.error('Erreur lors de la mise à jour du titre LinkedIn:', error);

        return {
            success: false,
            message: 'Échec de la mise à jour du titre',
            error: String(error),
        };
    }
}
