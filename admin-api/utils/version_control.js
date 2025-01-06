



/**
 * 抖音故事
 */
function version_before_tiktok_story($platform, $version) {
  if ($platform == 'h5') return true;
  if (!$platform || !$version) return false;

  return ($platform == 'android' && $version <= 629)
    || ($platform == 'ios' && $version <= 83)
}


/**增加水下广告结算 */
function version_before_mount_cpm($platform, $version) {
  if ($platform == 'h5') return true;
  if (!$platform || !$version) return false;

  return ($platform == 'android' && $version <= 724)
    || ($platform == 'ios' && $version <= 137)
}


module.exports = {
  version_before_tiktok_story,
  version_before_mount_cpm
}