import React, { useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { useTransition, animated } from '@react-spring/web';
import NavigationMenu from './NavigationMenu.js'

function Navigation() {
    const [showMenu, setShowMenu] = useState(false);

    const Menutransitions = useTransition(showMenu, {
        from: { opacity: 0, transform: 'translateX(-100%)' },
        enter: { opacity: 1, transform: 'translateX(0%)' },
        leave: { opacity: 0, transform: 'translateX(-100%)' },
    });
    const Masktransitions = useTransition(showMenu, {
        from: { position: 'absolute', opacity: 0 },
        enter: { opacity: 1 },
        leave: { opacity: 0 },
    });
    const [isDesktop] = useState(window.innerWidth >= 1024);

    return (
      <nav>
        <span className="text-xl lg:hidden">
          <FontAwesomeIcon
            icon={faBars}
            onClick={() => setShowMenu(!showMenu)}
          />
        </span>
        <div>{isDesktop ? <NavigationMenu /> : <div></div>}</div>

        {Masktransitions(
          (style, item) =>
            item && (
              <animated.div
                style={style}
                className="bg-black-t-50 fixed top-0 left-0 w-full h-full z-50"
                onClick={() => setShowMenu(false)}
              ></animated.div>
            )
        )}

        {Menutransitions(
          (style, item) =>
            item && (
              <animated.div
                style={style}
                className="fixed bg-white top-0 left-0 w-4/5 h-full z-50 shadow p-3"
              >
                <div className="font-bold py-3">E-Banking</div>
                <NavigationMenu closeMenu={() => setShowMenu(false)} />
              </animated.div>
            )
        )}
      </nav>
    );
}

export default Navigation;
