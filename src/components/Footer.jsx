import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="brand-left">
        <p>copyright&copy; 2026 Perspective Point of view</p>
      </div>
      <div className="inner">
        <div />
      </div>
      <div className="social-right">

        <Link to="https://www.instagram.com/perspective_point_of_view_/" class="social">
						<img src="Icons\Instagram-social-B.svg" class="icon-black"/>
						<img src="Icons\Instagram_social_W.svg" class="icon-white"/>
					</Link>
				
					<Link to="https://web.facebook.com/profile.php?id=61565901628476"class="social">
						<img src="Icons\Facebook-social-B.svg" class="icon-black"/>
						<img src="Icons\Facebook_social_W.svg" class="icon-white"/>
					</Link>

					<Link to="https://wa.link/eluege" class="social">
						<img src="Icons\Whatsapp-social-B.svg" class="icon-black"/>
						<img src="Icons\Whatsapp-social-W.svg" class="icon-white"/>
					</Link>

      </div>
    </footer>
  );
}
