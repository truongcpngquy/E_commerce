const db = require('../config/db');
const userRepository = require('../repositories/userRepository');

class UserService {
  /**
   * Lấy thông tin Profile của người dùng
   */
  async getProfile(userId) {
    const profile = await userRepository.findUserProfile(userId);

    if (!profile) {
      const err = new Error('Không tìm thấy profile!');
      err.statusCode = 404;
      throw err;
    }

    try {
      profile.preferred_categories = typeof profile.preferred_categories === 'string'
        ? JSON.parse(profile.preferred_categories)
        : (profile.preferred_categories || []);
    } catch (e) {
      profile.preferred_categories = [];
    }

    return profile;
  }

  /**
   * Cập nhật Profile & Sở thích cá nhân hóa
   */
  async updateProfile(userId, profileData) {
    const { full_name, gender, date_of_birth, phone, avatar_url, city, district, preferred_categories, price_sensitivity } = profileData;
    const prefCatsJson = preferred_categories ? JSON.stringify(preferred_categories) : JSON.stringify([]);

    const [existing] = await db.query('SELECT user_id FROM user_profiles WHERE user_id = ?', [userId]);

    if (existing.length === 0) {
      await db.query(
        `INSERT INTO user_profiles (user_id, full_name, gender, date_of_birth, phone, avatar_url, city, district, preferred_categories, price_sensitivity)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, full_name || '', gender || 'unspecified', date_of_birth || null, phone || '', avatar_url || '', city || '', district || '', prefCatsJson, price_sensitivity || 'mid-range']
      );
    } else {
      await db.query(
        `UPDATE user_profiles
         SET full_name = COALESCE(?, full_name),
             gender = COALESCE(?, gender),
             date_of_birth = COALESCE(?, date_of_birth),
             phone = COALESCE(?, phone),
             avatar_url = COALESCE(?, avatar_url),
             city = COALESCE(?, city),
             district = COALESCE(?, district),
             preferred_categories = ?,
             price_sensitivity = COALESCE(?, price_sensitivity)
         WHERE user_id = ?`,
        [full_name, gender, date_of_birth, phone, avatar_url, city, district, prefCatsJson, price_sensitivity, userId]
      );
    }

    return { success: true, message: 'Cập nhật thông tin profile thành công!' };
  }
}

module.exports = new UserService();
