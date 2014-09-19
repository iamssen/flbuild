package mailer.views {
import flash.events.Event;

import mailer.models.Email;

/** EmailFormEvent */
public class EmailFormEvent extends Event {
	public static const SUBMIT:String="submit";

	public var email:Email;

	/**
	* Constructor
	* 
	* @param type constructor argument type
	* @param email constructor argument email
	*/
	public function EmailFormEvent(type:String, email:Email) {
		super(type);
		this.email=email;
	}

	override public function clone():Event {
		return new EmailFormEvent(type, email);
	}
}
}
