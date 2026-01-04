import avatar from '../assets/magister-t/avatar.png'

function MagisterPortrait() {
  return (
    <div className="flex items-center justify-center h-full p-6">
      <div className="w-56 h-56 overflow-hidden">
        <img
          src={avatar}
          alt="Magister T"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  )
}

export default MagisterPortrait
